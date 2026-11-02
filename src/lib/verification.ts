import "server-only";
import { createHash, randomInt } from "node:crypto";
import { db } from "./db";
import { sendEmail } from "./email";

const CODE_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

export async function sendVerificationCode(user: { id: string; email: string; name: string }) {
  const last = await db.emailCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: "Please wait a minute before asking for another code." };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.emailCode.deleteMany({ where: { userId: user.id } });
  await db.emailCode.create({
    data: { userId: user.id, codeHash: hash(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  await sendEmail(
    user.email,
    `Your DesiBazaar code: ${code}`,
    `Hi ${user.name},\n\nYour DesiBazaar verification code is ${code}. It expires in 15 minutes.\n\nIf you didn't sign up, ignore this email.`,
  );
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
