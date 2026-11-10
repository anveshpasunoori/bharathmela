import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { metroName } from "@/lib/metros";
import { OG_SIZE, shareCard } from "@/lib/og-card";
import { ratingsFor } from "@/lib/reviews";
import { idFromSlugParam } from "@/lib/seo";

// The share card for a seller's page: their name, what they sell, rating and city.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Seller on BharathMela";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = idFromSlugParam((await params).id);
  const seller = await db.vendorProfile.findFirst({
    where: { id, user: { suspendedAt: null, deletedAt: null } },
    select: { id: true, businessName: true, metro: true, city: true, listings: { where: publicListing(), select: { category: true }, take: 50 } },
  });
  if (!seller) return shareCard({ kicker: "Seller", title: "Indian home businesses near you", footer: "bharathmela.com" });
  const rating = (await ratingsFor([seller.id])).get(seller.id);
  const categories = [...new Set(seller.listings.map((l) => categoryLabel(l.category)))].slice(0, 2);
  return shareCard({
    kicker: categories.join(" · ") || "Seller",
    title: seller.businessName,
    highlight: rating?.count ? `Rated ${rating.average.toFixed(1)} out of 5 · ${rating.count} review${rating.count === 1 ? "" : "s"}` : null,
    footer: seller.city || metroName(seller.metro),
  });
}
