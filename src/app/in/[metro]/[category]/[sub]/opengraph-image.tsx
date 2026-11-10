import { categoryLabel } from "@/lib/constants";
import { isMetro, metroName } from "@/lib/metros";
import { OG_SIZE, shareCard } from "@/lib/og-card";
import { categoryFromSlug } from "@/lib/seo";
import { subcategoryFromSlug } from "@/lib/subcategories";

// The share card for a subcategory page: "Oil change in Jacksonville, FL".
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BharathMela listings";

export default async function Image({ params }: { params: Promise<{ metro: string; category: string; sub: string }> }) {
  const { metro, category: slug, sub: subSlug } = await params;
  const category = categoryFromSlug(slug);
  const sub = category ? subcategoryFromSlug(category, subSlug) : null;
  const city = isMetro(metro) ? metroName(metro) : "";
  return shareCard({
    kicker: category ? categoryLabel(category) : "BharathMela",
    title: `${sub?.label ?? "Local listings"}${city ? ` in ${city}` : ""}`,
    footer: "From the Indian community · free for buyers",
  });
}
