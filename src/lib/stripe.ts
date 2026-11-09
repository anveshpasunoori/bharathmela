import "server-only";
// Card payments through Stripe, next to the manual Zelle/Venmo option. Plans are monthly subscriptions that
// renew by themselves; boosts are one-time payments. Sellers pay on Stripe's own Checkout page, so card
// details never reach BharathMela. Stripe's webhook (api/stripe/webhook) is what actually grants the plan or
// boost, so nothing depends on the seller coming back to the site. On when STRIPE_SECRET_KEY and
// STRIPE_WEBHOOK_SECRET are set.
import Stripe from "stripe";
import { activateBoost, enforceListingLimit } from "./billing";
import { db } from "./db";
import { PLANS, boostOption, isPaidPlan } from "./plans";
import { absoluteUrl } from "./seo";

const DAY_MS = 86_400_000;
let client: Stripe | null = null;

export const stripeEnabled = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

type Seller = { id: string; businessName: string; stripeCustomerId: string | null };

// The seller's Stripe customer, made on their first card payment.
async function customerFor(vendor: Seller, email: string) {
  if (vendor.stripeCustomerId) return vendor.stripeCustomerId;
  const customer = await stripe().customers.create({ email, name: vendor.businessName, metadata: { vendorId: vendor.id } });
  await db.vendorProfile.update({ where: { id: vendor.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

// Checkout for a monthly plan subscription; returns Stripe's page to send the seller to.
export async function planCheckoutUrl(vendor: Seller, email: string, planId: string) {
  if (!isPaidPlan(planId)) throw new Error("Not a paid plan");
  const plan = PLANS[planId];
  const metadata = { kind: "plan", vendorId: vendor.id, plan: plan.id };
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: await customerFor(vendor, email),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          recurring: { interval: "month" },
          product_data: { name: `BharathMela ${plan.name} plan`, description: plan.perks.join(" · ") },
        },
      },
    ],
    metadata,
    subscription_data: { metadata },
    success_url: absoluteUrl("/vendor?tab=billing&paid=1"),
    cancel_url: absoluteUrl(`/vendor/upgrade?plan=${plan.id}`),
  });
  return session.url!;
}

// Checkout for a one-time boost of one listing.
export async function boostCheckoutUrl(vendor: Seller, email: string, listing: { id: string; title: string }, days: number) {
  const option = boostOption(days);
  if (!option) throw new Error("Not a boost option");
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: await customerFor(vendor, email),
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: option.priceCents, product_data: { name: `Feature "${listing.title.slice(0, 80)}" for ${days} days` } },
      },
    ],
    metadata: { kind: "boost", vendorId: vendor.id, listingId: listing.id, days: String(days) },
    success_url: absoluteUrl("/vendor?paid=1"),
    cancel_url: absoluteUrl("/vendor"),
  });
  return session.url!;
}

// Stripe's page for updating the card, switching plans or cancelling.
export async function billingPortalUrl(vendor: Seller) {
  if (!vendor.stripeCustomerId) return null;
  const session = await stripe().billingPortal.sessions.create({ customer: vendor.stripeCustomerId, return_url: absoluteUrl("/vendor?tab=billing") });
  return session.url;
}

// What Stripe tells us happened. Each step is safe to run twice: Stripe retries webhooks.
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const meta = session.metadata ?? {};
      if (meta.kind === "plan" && meta.vendorId && typeof session.subscription === "string") {
        const vendor = await db.vendorProfile.findUnique({ where: { id: meta.vendorId } });
        if (!vendor) return;
        // Changing plan by checking out again: stop the old card subscription so they aren't billed twice.
        if (vendor.stripeSubscriptionId && vendor.stripeSubscriptionId !== session.subscription) {
          await stripe().subscriptions.cancel(vendor.stripeSubscriptionId).catch(() => {});
        }
        await db.vendorProfile.update({
          where: { id: vendor.id },
          data: { stripeSubscriptionId: session.subscription, ...(typeof session.customer === "string" ? { stripeCustomerId: session.customer } : {}) },
        });
      }
      if (meta.kind === "boost" && meta.vendorId && meta.listingId && session.payment_status === "paid") {
        await grantBoost(meta.vendorId, meta.listingId, Number(meta.days), session.id, session.amount_total ?? 0);
      }
      return;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const details = invoice.parent?.subscription_details;
      const meta = details?.metadata ?? {};
      const line = invoice.lines.data[0];
      if (meta.kind !== "plan" || !meta.vendorId || !isPaidPlan(meta.plan ?? "") || !line || !invoice.id) return;
      await grantPlanPeriod(meta.vendorId, meta.plan as "BASIC" | "PRO", invoice.id, line.period.start, line.period.end, invoice.amount_paid);
      return;
    }
    case "customer.subscription.deleted": {
      // Cancelled (by the seller or after failed payments): the period already paid for runs to its end.
      await db.vendorProfile.updateMany({ where: { stripeSubscriptionId: event.data.object.id }, data: { stripeSubscriptionId: null } });
      return;
    }
  }
}

// One paid month of a plan, from a paid Stripe invoice (the first one and every renewal).
async function grantPlanPeriod(vendorId: string, plan: "BASIC" | "PRO", invoiceId: string, start: number, end: number, amountCents: number) {
  if (await db.subscription.findUnique({ where: { stripeInvoiceId: invoiceId } })) return;
  await db.$transaction(async (tx) => {
    const sub = await tx.subscription.create({
      data: {
        vendorId,
        plan,
        status: "ACTIVE",
        source: "STRIPE",
        stripeInvoiceId: invoiceId,
        startsAt: new Date(start * 1000),
        // A day of grace, so a renewal that's a few hours late doesn't drop the plan.
        endsAt: new Date(end * 1000 + DAY_MS),
      },
    });
    await tx.payment.create({
      data: { vendorId, purpose: "SUBSCRIPTION", subscriptionId: sub.id, amountCents, method: "CARD", reference: invoiceId, status: "APPROVED", reviewedAt: new Date() },
    });
    await enforceListingLimit(vendorId, tx);
  });
}

async function grantBoost(vendorId: string, listingId: string, days: number, sessionId: string, amountCents: number) {
  if (!boostOption(days) || (await db.payment.findFirst({ where: { reference: sessionId } }))) return;
  const listing = await db.listing.findFirst({ where: { id: listingId, vendorId } });
  if (!listing) return;
  await db.$transaction(async (tx) => {
    const boost = await tx.adBoost.create({ data: { listingId, days } });
    await tx.payment.create({
      data: { vendorId, purpose: "AD_BOOST", adBoostId: boost.id, amountCents, method: "CARD", reference: sessionId, status: "APPROVED", reviewedAt: new Date() },
    });
    await activateBoost(tx, boost, listing);
  });
}
