"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { requireVendor } from "@/lib/auth";
import { activateBoost } from "@/lib/billing";
import { boostAvailability, localBoostDemand, TRIAL_BOOST_DAYS } from "@/lib/boost-offer";
import { db } from "@/lib/db";

export async function redeemBoostTrial(listingId: string): Promise<FormState> {
  const { vendor } = await requireVendor();
  const listing = await db.listing.findFirst({ where: { id: listingId, vendorId: vendor.id } });
  if (!listing) return { error: "Listing unavailable." };
  const demand = await localBoostDemand(listing);
  const error = await db.$transaction(async (tx) => {
    // Lock the seller row through the conditional update so a second tab cannot redeem the trial.
    const claimed = await tx.vendorProfile.updateMany({
      where: { id: vendor.id, boostTrialUsedAt: null },
      data: { boostTrialUsedAt: new Date() },
    });
    if (!claimed.count) return "Your free promotion has already been used.";
    await tx.$queryRaw`SELECT "id" FROM "Listing" WHERE "id" = ${listingId} AND "vendorId" = ${vendor.id} FOR UPDATE`;
    const current = await tx.listing.findFirst({ where: { id: listingId, vendorId: vendor.id } });
    const now = new Date();
    const changed = !current || current.metro !== listing.metro || current.category !== listing.category;
    const pending = await tx.adBoost.count({ where: { listingId, status: "PENDING" } });
    const unavailable = changed ? "Reload the listing before starting a promotion."
      : pending || (current.featuredUntil && current.featuredUntil > now) ? "This listing already has a promotion in progress."
      : boostAvailability(current, TRIAL_BOOST_DAYS, demand, now).reason;
    if (unavailable || !current) {
      await tx.vendorProfile.update({ where: { id: vendor.id }, data: { boostTrialUsedAt: null } });
      return unavailable ?? "Listing unavailable.";
    }
    const boost = await tx.adBoost.create({ data: { listingId, days: TRIAL_BOOST_DAYS } });
    await activateBoost(tx, boost, current, now);
    return null;
  });
  if (error) return { error };
  redirect(`/vendor/listings/${listingId}/boost?trial=1`);
}
