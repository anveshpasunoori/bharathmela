"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { createSession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkEmailDomain, sendEmail } from "@/lib/email";
import { passwordProblem } from "@/lib/password";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/seo";
import { checkVerificationCode, sendEmailChangeCode } from "@/lib/verification";

const RESET_TTL_MS = 60 * 60_000;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;

// "Forgot password": emails a one-time link. The answer is the same whether or not the address has an
// account, so the form can't be used to find out who is registered.
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = field(form, "email").toLowerCase();
  if (!validEmail(email)) return { error: "Enter the email address you signed up with." };
  if (!(await hit("passwordReset", await clientIp())) || !(await hit("passwordResetEmail", email))) return { error: TOO_MANY };
  const done = { message: "If that email has an account, we've sent a link to reset the password. It works for an hour; check your spam folder too." };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || user.suspendedAt) return done;
  const token = randomBytes(32).toString("hex");
  await db.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });
  await db.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } });
  const sent = await sendEmail(
    user.email,
    "Reset your BharathMela password",
    `Hi ${user.name},\n\nSomeone (hopefully you) asked to reset the password for your BharathMela account.\n\nChoose a new password: ${absoluteUrl(`/login/reset/${token}`)}\n\nThe link works once, for an hour. If you didn't ask for this, ignore this email; your password stays the same.\n\n– BharathMela`,
  );
  if (!sent) return { error: "We couldn't send the email just now. Please try again in a few minutes." };
  return done;
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = field(form, "token");
  const password = String(form.get("password") ?? "");
  if (!(await hit("passwordReset", await clientIp()))) return { error: TOO_MANY };
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.user.deletedAt || reset.user.suspendedAt) {
    return { error: "This link has expired or was already used. Ask for a new one." };
  }
  const problem = passwordProblem(password, reset.user.email);
  if (problem) return { error: problem };
  await db.$transaction([
    db.user.update({
      where: { id: reset.userId },
      // Opening the emailed link proves they own the address.
      data: { passwordHash: await bcrypt.hash(password, 10), emailVerifiedAt: reset.user.emailVerifiedAt ?? new Date() },
    }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    // Anyone who was signed in with the old password is signed out.
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await createSession(reset.userId);
  redirect(reset.user.role === "VENDOR" ? "/vendor?reset=1" : "/account?reset=1");
}

// Changing the account's email: a code goes to the new address, and the switch happens once it's entered.
export async function changeEmail(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const email = field(form, "email").toLowerCase();
  if (!(await bcrypt.compare(String(form.get("password") ?? ""), user.passwordHash))) return { error: "Your password is wrong." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (email === user.email) return { error: "That's already your email." };
  if (!(await hit("emailChange", user.id))) return { error: TOO_MANY };
  const domainError = await checkEmailDomain(email);
  if (domainError) return { error: domainError };
  if (await db.user.findUnique({ where: { email } })) return { error: "Another account already uses that email." };
  const { error } = await sendEmailChangeCode(user, email);
  if (error) return { error };
  await db.user.update({ where: { id: user.id }, data: { pendingEmail: email } });
  revalidatePath("/account");
  return { message: `We sent a 6-digit code to ${email}. Enter it below to finish.` };
}

export async function confirmEmailChange(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  if (!user.pendingEmail) return { error: "Start by entering your new email above." };
  const error = await checkVerificationCode(user.id, field(form, "code"));
  if (error) return { error };
  const oldEmail = user.email;
  try {
    await db.user.update({ where: { id: user.id }, data: { email: user.pendingEmail, pendingEmail: null, emailVerifiedAt: new Date() } });
  } catch {
    return { error: "Another account started using that email. Try a different one." };
  }
  // Tell the old address, in case this wasn't them.
  await sendEmail(
    oldEmail,
    "Your BharathMela email was changed",
    `Hi ${user.name},\n\nThe email for your BharathMela account was changed to ${user.pendingEmail}. If you didn't do this, contact us right away: ${absoluteUrl("/contact")}\n\n– BharathMela`,
  );
  revalidatePath("/account");
  return { message: `Done. Your account now uses ${user.pendingEmail}.` };
}

export async function cancelEmailChange() {
  const user = await requireUser("/account");
  await db.user.update({ where: { id: user.id }, data: { pendingEmail: null } });
  await db.emailCode.deleteMany({ where: { userId: user.id } });
  revalidatePath("/account");
}
