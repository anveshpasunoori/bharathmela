"use server";

import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingPortalUrl, boostCheckoutUrl, planCheckoutUrl, stripeEnabled } from "@/lib/stripe";

// Buttons that send the seller to Stripe: card checkout for a plan or a boost, and the billing portal.
export async function payPlanByCard(planId: string) {
  const { user, vendor } = await requireVendor();
  if (!stripeEnabled()) redirect(`/vendor/upgrade?plan=${planId}`);
  redirect(await planCheckoutUrl(vendor, user.email, planId));
}

export async function payBoostByCard(listingId: string, days: number) {
  const { user, vendor } = await requireVendor();
  const listing = await db.listing.findFirst({ where: { id: listingId, vendorId: vendor.id, status: "ACTIVE" } });
  if (!listing || !stripeEnabled()) redirect("/vendor");
  redirect(await boostCheckoutUrl(vendor, user.email, listing, days));
}

export async function openBillingPortal() {
  const { vendor } = await requireVendor();
  const url = stripeEnabled() ? await billingPortalUrl(vendor) : null;
  redirect(url ?? "/vendor?tab=billing");
}
