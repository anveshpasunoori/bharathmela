import "server-only";
// Growing the marketplace: free Pro for each city's first sellers, a free Pro month for sellers who bring
// another seller, and remembering where people came from (utm links, referral links) when they sign up.
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { sendEmail } from "./email";
import { absoluteUrl } from "./seo";

const DAY_MS = 86_400_000;
type Tx = Prisma.TransactionClient;

// The first sellers in each city get Pro free for a while. Both numbers can be changed without a deploy of code.
export const FOUNDING_SELLERS_PER_CITY = Number(process.env.FOUNDING_SELLERS_PER_CITY ?? 50);
export const FOUNDING_PRO_DAYS = Number(process.env.FOUNDING_PRO_DAYS ?? 90);
// A seller earns a free Pro month for each seller they refer who posts a listing, up to a year's worth.
export const REFERRAL_PRO_DAYS = 30;
export const REFERRAL_REWARDS_PER_YEAR = 12;

// Cookies set by src/proxy.ts on a visitor's first tagged visit.
export const SOURCE_COOKIE = "bm_src";
export const REFERRAL_COOKIE = "bm_ref";

// Free Pro days, added after any Pro time the seller already has so nothing is lost.
export async function grantFreePro(vendorId: string, days: number, source: "FOUNDING" | "REFERRAL", client: Tx | typeof db = db) {
  const now = new Date();
  const latestPro = await client.subscription.findFirst({
    where: { vendorId, plan: "PRO", status: "ACTIVE", endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
  });
  const startsAt = latestPro?.endsAt && latestPro.endsAt > now ? latestPro.endsAt : now;
  return client.subscription.create({
    data: { vendorId, plan: "PRO", status: "ACTIVE", source, startsAt, endsAt: new Date(startsAt.getTime() + days * DAY_MS) },
  });
}

// Called once a seller's email is verified: one of the first sellers in their city becomes a founding
// seller with free Pro. Safe to call more than once.
export async function welcomeVerifiedSeller(userId: string) {
  const vendor = await db.vendorProfile.findUnique({ where: { userId } });
  if (!vendor || vendor.foundingSeller || FOUNDING_SELLERS_PER_CITY <= 0) return false;
  const already = await db.subscription.count({ where: { vendorId: vendor.id, source: "FOUNDING" } });
  if (already) return false;
  const founders = await db.vendorProfile.count({ where: { metro: vendor.metro, foundingSeller: true } });
  if (founders >= FOUNDING_SELLERS_PER_CITY) return false;
  await db.$transaction(async (tx) => {
    await tx.vendorProfile.update({ where: { id: vendor.id }, data: { foundingSeller: true } });
    await grantFreePro(vendor.id, FOUNDING_PRO_DAYS, "FOUNDING", tx);
  });
  return true;
}

// Called after a seller posts a listing: the seller who referred them gets a free Pro month, once.
export async function rewardReferrer(vendorId: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    include: { referredBy: { include: { user: { select: { email: true, name: true, deletedAt: true, suspendedAt: true } } } } },
  });
  const referrer = vendor?.referredBy;
  if (!vendor || !referrer || vendor.referralRewardedAt || referrer.user.deletedAt || referrer.user.suspendedAt) return;
  // Claim the reward first so two listings posted at once can't both pay it.
  const claimed = await db.vendorProfile.updateMany({ where: { id: vendor.id, referralRewardedAt: null }, data: { referralRewardedAt: new Date() } });
  if (!claimed.count) return;
  const lastYear = await db.subscription.count({
    where: { vendorId: referrer.id, source: "REFERRAL", createdAt: { gt: new Date(Date.now() - 365 * DAY_MS) } },
  });
  if (lastYear >= REFERRAL_REWARDS_PER_YEAR) return;
  const sub = await grantFreePro(referrer.id, REFERRAL_PRO_DAYS, "REFERRAL");
  await sendEmail(
    referrer.user.email,
    "You earned a free month of Pro",
    `Hi ${referrer.user.name},\n\n${vendor.businessName} joined BharathMela through your link and posted their first listing, so you get a free month of Pro (until ${sub.endsAt!.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}).\n\nInvite more sellers: ${absoluteUrl("/vendor/promote")}\n\n– BharathMela`,
  );
}

// Where this visitor came from, from the cookies set on their first tagged visit.
export async function readAttribution() {
  const jar = await cookies();
  let source = "";
  let campaign = "";
  try {
    const parsed = JSON.parse(jar.get(SOURCE_COOKIE)?.value ?? "{}") as { s?: string; c?: string };
    source = String(parsed.s ?? "").slice(0, 60);
    campaign = String(parsed.c ?? "").slice(0, 80);
  } catch {
    // A malformed cookie just means no source.
  }
  const ref = jar.get(REFERRAL_COOKIE)?.value ?? "";
  return { source, campaign, ref: /^[a-z0-9]{10,40}$/.test(ref) ? ref : "" };
}

// The referring seller for a new seller, if the referral link was real and isn't their own.
export async function referringVendorId(ref: string, newUserId?: string) {
  if (!ref) return null;
  const referrer = await db.vendorProfile.findUnique({ where: { id: ref }, select: { id: true, userId: true, user: { select: { deletedAt: true, suspendedAt: true } } } });
  if (!referrer || referrer.userId === newUserId || referrer.user.deletedAt || referrer.user.suspendedAt) return null;
  return referrer.id;
}
