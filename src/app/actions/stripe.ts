"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ActionForm";
import { boostAvailability, localBoostDemand } from "@/lib/boost-offer";
import { boostOption } from "@/lib/plans";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingPortalUrl, boostCheckoutUrl, planCheckoutUrl, sellerStripeSubscription, stripe, stripeEnabled } from "@/lib/stripe";

// Buttons that send the seller to Stripe: card checkout for a plan or a boost, and the billing portal.
export async function payPlanByCard(planId: string) {
  const { user, vendor } = await requireVendor();
  if (!stripeEnabled()) redirect(`/vendor/upgrade?plan=${planId}`);
  redirect(await planCheckoutUrl(vendor, user.email, planId));
}

export async function payBoostByCard(listingId: string, days: number) {
  const { user, vendor } = await requireVendor();
  const listing = await db.listing.findFirst({ where: { id: listingId, vendorId: vendor.id, status: "ACTIVE" } });
  if (!listing || !stripeEnabled() || !boostOption(days)) redirect("/vendor");
  const [demand, pending] = await Promise.all([
    localBoostDemand(listing),
    db.adBoost.count({ where: { listingId, status: "PENDING" } }),
  ]);
  if (pending || boostAvailability(listing, days, demand).reason) redirect(`/vendor/listings/${listing.id}/boost?days=${days}&unavailable=1`);
  redirect(await boostCheckoutUrl(vendor, user.email, listing, days));
}

export async function openBillingPortal() {
  const { vendor } = await requireVendor();
  const url = stripeEnabled() ? await billingPortalUrl(vendor) : null;
  redirect(url ?? "/vendor?tab=billing");
}

export async function setPlanRenewal(renew: boolean): Promise<FormState> {
  const { vendor } = await requireVendor();
  try {
    const subscription = await sellerStripeSubscription(vendor);
    if (!subscription) return { error: "No current card subscription is available to change." };
    await stripe().subscriptions.update(subscription.id, { cancel_at_period_end: !renew });
  } catch {
    return { error: "We couldn’t update renewal. Try again or use Manage billing." };
  }
  revalidatePath("/vendor");
  return { message: renew ? "Automatic renewal is on." : "Automatic renewal is off. Your current paid period will continue." };
}
