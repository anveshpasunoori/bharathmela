import "server-only";
import { createHash, randomInt } from "node:crypto";
import { db } from "./db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";

const CODE_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

export async function sendVerificationCode(user: { id: string; email: string; name: string }) {
  const last = await db.emailCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: "Please wait a minute before asking for another code.", waiting: true };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.emailCode.deleteMany({ where: { userId: user.id } });
  await db.emailCode.create({
    data: { userId: user.id, codeHash: hash(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  const sent = await sendEmail(
    user.email,
    `Your BharathMela code: ${code}`,
    `Hi ${user.name},\n\nYour BharathMela verification code is ${code}. It expires in 15 minutes.\n\nIf you didn't sign up, ignore this email.`,
  );
  if (!sent) {
    // No waiting period for a retry when the email never went out.
    await db.emailCode.deleteMany({ where: { userId: user.id } });
    return { error: "We couldn't send your code just now. Please try again in a few minutes." };
  }
  return {};
}

export async function checkVerificationCode(userId: string, code: string): Promise<string | null> {
  const record = await db.emailCode.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!record || record.expiresAt < new Date()) return "That code has expired. Send a new one.";
  if (record.attempts >= MAX_ATTEMPTS) return "Too many wrong tries. Send a new code.";
  if (record.codeHash !== hash(code.trim())) {
    await db.emailCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "That code isn't right. Check your email and try again.";
  }
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailCode.deleteMany({ where: { userId } }),
  ]);
  return null;
}

// Texted code for sellers' phone numbers, shown to buyers as "Phone verified".
export async function sendPhoneCode(userId: string, phone: string) {
  const last = await db.phoneCode.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: "Please wait a minute before asking for another code.", waiting: true };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.phoneCode.deleteMany({ where: { userId } });
  await db.phoneCode.create({ data: { userId, phone, codeHash: hash(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
  await sendSms(phone, `Your BharathMela code is ${code}. It expires in 15 minutes.`);
  return {};
}

export async function checkPhoneCode(userId: string, code: string): Promise<string | null> {
  const record = await db.phoneCode.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!record || record.expiresAt < new Date()) return "That code has expired. Send a new one.";
  if (record.attempts >= MAX_ATTEMPTS) return "Too many wrong tries. Send a new code.";
  if (record.codeHash !== hash(code.trim())) {
    await db.phoneCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "That code isn't right. Check your texts and try again.";
  }
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } }),
    db.phoneCode.deleteMany({ where: { userId } }),
  ]);
  return null;
}
