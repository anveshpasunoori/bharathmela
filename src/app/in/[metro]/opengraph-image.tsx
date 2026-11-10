import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { OG_SIZE, shareCard } from "@/lib/og-card";

// The share card for a city's page: "Indian businesses in Jacksonville, FL · 38 listings".
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Indian home businesses on BharathMela";

export default async function Image({ params }: { params: Promise<{ metro: string }> }) {
  const { metro } = await params;
  const city = isMetro(metro) ? metroName(metro) : "your city";
  const count = isMetro(metro) ? await db.listing.count({ where: { ...publicListing(), metro } }) : 0;
  return shareCard({
    kicker: "Indian community marketplace",
    title: `Indian businesses in ${city}`,
    highlight: count ? `${count} local listing${count === 1 ? "" : "s"}` : "Home food, tutors, pujaris and more",
    footer: "Compare prices and reviews · free for buyers",
  });
}
