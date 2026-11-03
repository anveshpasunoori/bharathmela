import "server-only";
import { db } from "./db";
import { milesBetween, zipCoords } from "./geo";
import { publicListing } from "./listings";
import { readRental } from "./rentals";
import { NEARBY_MILES, compareRent } from "./rent-stats";

// Compares a room listing's rent with live listings of the same space type within NEARBY_MILES.
export async function rentComparison(listing: { id: string; zip: string; priceCents: number | null; details: string }) {
  const rental = readRental(listing.details);
  const here = zipCoords(listing.zip);
  if (!rental || !here || listing.priceCents == null) return null;
  const others = await db.listing.findMany({
    where: { ...publicListing(), category: "ROOM_RENTAL", id: { not: listing.id }, priceCents: { not: null } },
    select: { zip: true, priceCents: true, details: true },
    take: 5000,
  });
  const comparable = others
    .filter((o) => readRental(o.details)?.spaceType === rental.spaceType)
    .filter((o) => {
      const c = zipCoords(o.zip);
      return c && milesBetween(here, c) <= NEARBY_MILES;
    })
    .map((o) => o.priceCents!);
  return compareRent(listing.priceCents, comparable);
}
