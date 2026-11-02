"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkEmailDomain } from "@/lib/email";
import { TERMS_VERSION } from "@/lib/legal";
import { isMetro } from "@/lib/metros";
import { passwordProblem } from "@/lib/password";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { checkVerificationCode, sendVerificationCode } from "@/lib/verification";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

// Only allow same-site relative paths, so `next` can't send people off-site.
function safeNext(form: FormData, fallback = "/") {
  const next = field(form, "next");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

// Checks shared by buyer and seller signup. Returns an error message or null.
async function signupProblem(email: string, password: string, form: FormData) {
  if (!hit("signup", await clientIp())) return TOO_MANY;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return "Enter a valid email address.";
  const pw = passwordProblem(password, email);
  if (pw) return pw;
  if (form.get("terms") !== "on") return "You must agree to the Terms of Service.";
  const domainError = await checkEmailDomain(email);
  if (domainError) return domainError;
  if (await db.user.findUnique({ where: { email } })) return "An account with this email already exists. Log in instead.";
  return null;
}

export async function vendorSignup(_: FormState, form: FormData): Promise<FormState> {
  const name = field(form, "name").slice(0, 100);
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const businessName = field(form, "businessName").slice(0, 100);
  const phone = field(form, "phone");
  const metro = field(form, "metro");
  const zip = field(form, "zip");

  if (!name || !businessName) return { error: "Please fill in all fields." };
  if (phone.replace(/\D/g, "").length < 10) return { error: "Enter a 10-digit US phone number." };
  if (!isMetro(metro)) return { error: "Choose your city." };
  if (!/^\d{5}$/.test(zip)) return { error: "Enter a 5-digit ZIP code." };
  const problem = await signupProblem(email, password, form);
  if (problem) return { error: problem };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      vendor: { create: { businessName, phone, whatsapp: form.get("whatsapp") === "on", metro, zip } },
    },
  });
  await sendVerificationCode(user);
  await createSession(user.id);
  redirect("/verify?next=/vendor");
}

export async function buyerSignup(_: FormState, form: FormData): Promise<FormState> {
  const name = field(form, "name").slice(0, 100);
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form);

  if (!name) return { error: "Please enter your name." };
  const problem = await signupProblem(email, password, form);
  if (problem) return { error: problem };

  const user = await db.user.create({
    data: {
      name,
      email,
      role: "BUYER",
      passwordHash: await bcrypt.hash(password, 10),
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
    },
  });
  await sendVerificationCode(user);
  await createSession(user.id);
  redirect(`/verify?next=${encodeURIComponent(next)}`);
}

export async function verifyEmail(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const error = await checkVerificationCode(user.id, field(form, "code"));
  if (error) return { error };
  redirect(safeNext(form));
}

export async function resendVerificationCode(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await sendVerificationCode(user);
  return error ? { error } : { message: "We sent a new code. Check your inbox (and spam folder)." };
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!hit("login", await clientIp()) || !hit("loginEmail", email)) return { error: TOO_MANY };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Wrong email or password." };
  }
  if (user.suspendedAt) {
    return { error: "This account has been suspended. Contact support if you think this is a mistake." };
  }
  await createSession(user.id);
  if (user.role === "ADMIN") redirect("/admin");
  const next = safeNext(form, user.role === "VENDOR" ? "/vendor" : "/");
  redirect(user.emailVerifiedAt ? next : `/verify?next=${encodeURIComponent(next)}`);
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Your current password is wrong." };
  const problem = passwordProblem(next, user.email);
  if (problem) return { error: problem };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  // Sign out every other device.
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return { message: "Password changed. Other devices have been signed out." };
}

// Anonymizes the account and removes everything public, but keeps payment records
// (needed for accounting and disputes).
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  if (user.role === "ADMIN") return { error: "Admin accounts can't be deleted here." };
  if (!(await bcrypt.compare(String(form.get("password") ?? ""), user.passwordHash))) {
    return { error: "Your password is wrong." };
  }
  if (field(form, "confirm") !== "DELETE") return { error: 'Type DELETE to confirm.' };

  await db.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { buyerId: user.id } });
    if (user.vendor) {
      await tx.listing.deleteMany({ where: { vendorId: user.vendor.id } });
      await tx.review.deleteMany({ where: { vendorId: user.vendor.id } });
      await tx.vendorProfile.update({
        where: { id: user.vendor.id },
        data: { businessName: "Deleted seller", phone: "", about: "", whatsapp: false },
      });
    }
    await tx.emailCode.deleteMany({ where: { userId: user.id } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: "Deleted user",
        email: `deleted-${user.id}@deleted.invalid`,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        deletedAt: new Date(),
      },
    });
  });
  await destroySession();
  redirect("/?deleted=1");
}
