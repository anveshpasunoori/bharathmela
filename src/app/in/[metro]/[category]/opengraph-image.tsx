import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { OG_SIZE, shareCard } from "@/lib/og-card";
import { CATEGORY_SEO_TITLE, categoryFromSlug } from "@/lib/seo";

// The share card for a city-category page: "Indian Home Food & Tiffin Services in Jacksonville, FL".
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BharathMela category page";

export default async function Image({ params }: { params: Promise<{ metro: string; category: string }> }) {
  const { metro, category: slug } = await params;
  const category = categoryFromSlug(slug);
  const city = isMetro(metro) ? metroName(metro) : "";
  const count = category && city ? await db.listing.count({ where: { ...publicListing(), metro, category } }) : 0;
  return shareCard({
    kicker: category ? categoryLabel(category) : "BharathMela",
    title: category ? `${CATEGORY_SEO_TITLE[category] ?? categoryLabel(category)}${city ? ` in ${city}` : ""}` : "Indian home businesses near you",
    highlight: count ? `${count} local listing${count === 1 ? "" : "s"}` : null,
    footer: "Compare prices and reviews · free for buyers",
  });
}
