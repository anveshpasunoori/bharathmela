import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { sendEmail } from "./email";
import { PLANS, PLAN_PERIOD_DAYS, type PlanId } from "./plans";

const DAY_MS = 86_400_000;

type Tx = Prisma.TransactionClient;

export async function getVendorPlan(vendorId: string, client: Tx = db) {
  const subscription = await client.subscription.findFirst({
    where: { vendorId, status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
  });
  const planId = (subscription?.plan as PlanId | undefined) ?? "FREE";
  return { plan: PLANS[planId], subscription };
}

// Hide listings beyond what the vendor's current plan allows.
// Featured listings are kept first, then the oldest ones.
export async function enforceListingLimit(vendorId: string, client: Tx = db) {
  const { plan } = await getVendorPlan(vendorId, client);
  const active = await client.listing.findMany({
    where: { vendorId, status: "ACTIVE" },
    orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
    select: { id: true },
  });
  const overflow = active.slice(plan.maxListings).map((l) => l.id);
  if (overflow.length) {
    await client.listing.updateMany({ where: { id: { in: overflow } }, data: { status: "HIDDEN" } });
  }
}

let lastSync = 0;

// Expire lapsed plans and boosts. Runs lazily on page loads (at most once a minute);
// move to a scheduled job once traffic grows.
export async function syncExpirations() {
  if (Date.now() - lastSync < 60_000) return;
  lastSync = Date.now();
  const now = new Date();
  const lapsed = await db.subscription.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    select: { id: true, vendorId: true },
  });
  if (lapsed.length) {
    await db.subscription.updateMany({
      where: { id: { in: lapsed.map((s) => s.id) } },
      data: { status: "EXPIRED" },
    });
    for (const vendorId of new Set(lapsed.map((s) => s.vendorId))) {
      await enforceListingLimit(vendorId);
    }
  }
  await db.adBoost.updateMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "EXPIRED" },
  });

  // A week before a listing expires, remind the seller once so good listings don't silently disappear.
  const expiring = await db.listing.findMany({
    where: { status: "ACTIVE", expiryWarnedAt: null, expiresAt: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } },
    include: { vendor: { include: { user: { select: { email: true, name: true } } } } },
    take: 200,
  });
  for (const l of expiring) {
    await db.listing.update({ where: { id: l.id }, data: { expiryWarnedAt: now } });
    await sendEmail(
      l.vendor.user.email,
      `Your BharathMela listing "${l.title}" expires soon`,
      `Hi ${l.vendor.user.name},\n\nYour listing "${l.title}" will stop showing on ${l.expiresAt!.toLocaleDateString("en-US", { month: "long", day: "numeric" })}. ` +
        `If it's still available, renew it from your dashboard in one click. Listings expire so buyers only see businesses that are still active.\n\n– BharathMela`,
    ).catch((e) => console.error("expiry reminder failed", e));
  }
}

export async function approvePayment(paymentId: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true, adBoost: { include: { listing: true } } },
    });
    if (!payment || payment.status !== "PENDING") throw new Error("Payment is not pending");
    const now = new Date();

    if (payment.subscription) {
      const sub = payment.subscription;
      const { subscription: current } = await getVendorPlan(payment.vendorId, tx);
      // Renewing the same plan extends it; switching plans starts the new one today.
      const periodStart = current?.plan === sub.plan && current.endsAt ? current.endsAt : now;
      if (current) {
        await tx.subscription.update({ where: { id: current.id }, data: { status: "EXPIRED", endsAt: now } });
      }
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          startsAt: now,
          endsAt: new Date(periodStart.getTime() + PLAN_PERIOD_DAYS * DAY_MS),
        },
      });
      // A downgrade may leave the vendor over their new limit.
      await enforceListingLimit(payment.vendorId, tx);
    }

    if (payment.adBoost) {
      const boost = payment.adBoost;
      const listing = boost.listing;
      // Stack on top of any boost that is still running.
      const startsAt = listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
      const endsAt = new Date(startsAt.getTime() + boost.days * DAY_MS);
      await tx.adBoost.update({ where: { id: boost.id }, data: { status: "ACTIVE", startsAt, endsAt } });
      await tx.listing.update({ where: { id: listing.id }, data: { featuredUntil: endsAt } });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: now },
    });
  });
}

export async function rejectPayment(paymentId: string, adminId: string, note: string) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== "PENDING") throw new Error("Payment is not pending");
    if (payment.subscriptionId) {
      await tx.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "REJECTED" } });
    }
    if (payment.adBoostId) {
      await tx.adBoost.update({ where: { id: payment.adBoostId }, data: { status: "REJECTED" } });
    }
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REJECTED", adminNote: note, reviewedById: adminId, reviewedAt: new Date() },
    });
  });
}
