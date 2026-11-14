"use server";

import { safeNextPath } from "@/lib/return-path";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { checkEmailDomain } from "@/lib/email";
import { TERMS_VERSION } from "@/lib/legal";
import { isMetro } from "@/lib/metros";
import { passwordProblem } from "@/lib/password";
import { deleteListingFiles } from "@/lib/photos";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { checkVerificationCode, sendVerificationCode } from "@/lib/verification";
import { readAttribution, referringVendorId, welcomeVerifiedSeller } from "@/lib/growth";
import { resolveLocation } from "@/lib/user-location";
import { sellerPlace } from "@/lib/geo";
import { allocateSellerPath } from "@/lib/seller-urls";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

// Only allow same-site relative paths, so `next` can't send people off-site.
function safeNext(form: FormData, fallback = "/") {
  const next = field(form, "next");
  return safeNextPath(next, fallback);
}

// The monthly "new in your city" email is opt-in, for the city they sign up in.
function cityEmailChoice(form: FormData, metro: string) {
  return form.get("cityEmails") === "on" && isMetro(metro) ? { cityEmails: true, cityEmailMetro: metro } : {};
}

// Checks shared by buyer and seller signup. Returns an error message or null.
async function signupProblem(email: string, password: string, form: FormData) {
  if (!(await hit("signup", await clientIp()))) return TOO_MANY;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return "Enter a valid email address.";
  const pw = passwordProblem(password, email);
  if (pw) return pw;
  if (form.get("terms") !== "on") return "You must agree to the Terms of Service.";
  const domainError = await checkEmailDomain(email);
  if (domainError) return domainError;
  if (await db.user.findUnique({ where: { email } })) return "An account with this email already exists. Log in instead.";
  return null;
}

// Seller details shared by new sign-ups and existing accounts becoming sellers. People selling for
// themselves (a garage sale, a room) skip the business name and appear under their own name.
function sellerDetails(form: FormData, name: string) {
  const individual = field(form, "kind") === "individual";
  const businessName = (individual ? name : field(form, "businessName")).slice(0, 100);
  const phone = field(form, "phone");
  const zip = field(form, "zip");
  if (!name || !businessName) return { error: individual ? "Please enter your name." : "Please enter your business name." };
  if (phone.replace(/\D/g, "").length < 10) return { error: "Enter a 10-digit US phone number." };
  if (!/^\d{5}$/.test(zip)) return { error: "Enter a 5-digit ZIP code." };
  // The ZIP decides the metro (which city page the listings appear on); the town is what they typed.
  const place = sellerPlace(zip, field(form, "city"));
  if (!place) return { error: `We couldn't find ZIP ${zip}. Please check it.` };
  return { businessName, phone, whatsapp: form.get("whatsapp") === "on", metro: place.metro, city: place.city, zip };
}

export async function vendorSignup(_: FormState, form: FormData): Promise<FormState> {
  const name = field(form, "name").slice(0, 100);
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const seller = sellerDetails(form, name);
  if ("error" in seller) return seller;
  const next = safeNext(form, "/vendor");
  const problem = await signupProblem(email, password, form);
  if (problem) return { error: problem };

  const from = await readAttribution();
  const referredById = await referringVendorId(from.ref);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.$transaction(async (tx) => tx.user.create({
    data: {
      name,
      email,
      passwordHash,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      signupSource: from.source || (referredById ? "referral" : ""),
      signupCampaign: from.campaign,
      ...cityEmailChoice(form, seller.metro),
      vendor: { create: { ...seller, referredById, publicPath: await allocateSellerPath(tx, seller) } },
    },
  }));
  const { error: notSent } = await sendVerificationCode(user);
  await createSession(user.id);
  redirect(`/verify?next=${encodeURIComponent(next)}${notSent ? "&unsent=1" : ""}`);
}

// A signed-in buyer starting to sell: add seller details to the account they already have.
export async function becomeSeller(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vendor/signup");
  if (user.vendor) redirect("/vendor");
  if (form.get("terms") !== "on") return { error: "Please agree to the Terms of Service." };
  const seller = sellerDetails(form, user.name);
  if ("error" in seller) return seller;
  const referredById = await referringVendorId((await readAttribution()).ref, user.id);
  await db.$transaction(async (tx) => tx.user.update({
    where: { id: user.id },
    data: {
      role: user.role === "ADMIN" ? "ADMIN" : "VENDOR",
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      vendor: { create: { ...seller, referredById, publicPath: await allocateSellerPath(tx, seller) } },
    },
  }));
  if (user.emailVerifiedAt) await welcomeVerifiedSeller(user.id);
  const next = safeNext(form, "/vendor");
  redirect(user.emailVerifiedAt ? next : `/verify?next=${encodeURIComponent(next)}`);
}

export async function buyerSignup(_: FormState, form: FormData): Promise<FormState> {
  const name = field(form, "name").slice(0, 100);
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form);

  if (!name) return { error: "Please enter your name." };
  const problem = await signupProblem(email, password, form);
  if (problem) return { error: problem };

  const from = await readAttribution();
  const { metro } = await resolveLocation();
  const user = await db.user.create({
    data: {
      name,
      email,
      role: "BUYER",
      passwordHash: await bcrypt.hash(password, 10),
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      signupSource: from.source,
      signupCampaign: from.campaign,
      ...cityEmailChoice(form, metro),
    },
  });
  const { error: notSent } = await sendVerificationCode(user);
  await createSession(user.id);
  redirect(`/verify?next=${encodeURIComponent(next)}${notSent ? "&unsent=1" : ""}`);
}

export async function verifyEmail(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const error = await checkVerificationCode(user.id, field(form, "code"));
  if (error) return { error };
  // One of the first sellers in their city gets free Pro.
  const founding = await welcomeVerifiedSeller(user.id);
  const next = safeNext(form);
  redirect(founding && next.startsWith("/vendor") ? `${next}${next.includes("?") ? "&" : "?"}founding=1` : next);
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
  if (!(await hit("login", await clientIp())) || !(await hit("loginEmail", email))) return { error: TOO_MANY };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Wrong email or password." };
  }
  if (user.suspendedAt) {
    return { error: "This account has been suspended. Contact support if you think this is a mistake." };
  }
  await createSession(user.id);
  if (user.role === "ADMIN") redirect("/admin");
  let next = safeNext(form, user.role === "VENDOR" ? "/vendor" : "/");
  // Tapped a heart while logged out: save it now, before the page (and its saved count) is drawn.
  if (next.startsWith("/saved/add?")) next = await saveAfterLogin(user.id, new URLSearchParams(next.split("?")[1]));
  if (user.emailVerifiedAt) redirect(next);
  // Not verified yet: send a fresh code (the old one may have expired or never arrived).
  const sent = await sendVerificationCode(user);
  redirect(`/verify?next=${encodeURIComponent(next)}${sent.error && !sent.waiting ? "&unsent=1" : ""}`);
}

async function saveAfterLogin(userId: string, params: URLSearchParams) {
  const id = params.get("id") ?? "";
  const back = params.get("back") ?? "/saved";
  if (/^[a-z0-9]+$/i.test(id) && (await db.listing.findFirst({ where: { id, ...publicListing() }, select: { id: true } }))) {
    await db.favorite.upsert({ where: { userId_listingId: { userId, listingId: id } }, create: { userId, listingId: id }, update: {} });
  }
  return safeNextPath(back, "/saved");
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

  let listingIds: string[] = [];
  await db.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { buyerId: user.id } });
    if (user.vendor) {
      listingIds = (await tx.listing.findMany({ where: { vendorId: user.vendor.id }, select: { id: true } })).map((l) => l.id);
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
  for (const id of listingIds) await deleteListingFiles(id);
  await destroySession();
  redirect("/?deleted=1");
}
