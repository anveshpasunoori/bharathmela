import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { priceLabel } from "@/lib/plans";
import { idFromSlugParam } from "@/lib/seo";
import { shareCard } from "@/lib/og-card";

// The share card for listings without a photo (WhatsApp, Facebook, X, iMessage previews).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BharathMela listing";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const listing = await db.listing.findUnique({
    where: { id: idFromSlugParam((await params).id) },
    select: { title: true, category: true, metro: true, priceCents: true, priceUnit: true, vendor: { select: { businessName: true } } },
  });
  const price = listing?.priceCents != null ? priceLabel(listing.priceCents, listing.priceUnit) : null;
  return shareCard({
    kicker: listing ? categoryLabel(listing.category) : "Listing",
    title: listing?.title ?? "Indian home businesses near you",
    highlight: price ? `${price.main} ${price.unit}`.trim() : null,
    footer: listing ? `${listing.vendor.businessName} · ${metroName(listing.metro)}` : "Indian home businesses near you",
  });
}
