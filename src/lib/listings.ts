import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { milesBetween, zipCoords } from "./geo";
import { ratingsFor } from "./reviews";
import { type EventServiceFilters, eventServiceSearchText, matchesEventServiceFilters, readEventService } from "./event-services";
import { type ProfessionalFilters, isProfessional, matchesProfessionalFilters, professionalSearchText, readProfessional } from "./professionals";
import { type RentalFilters, matchesRentalFilters, readRental, rentalSearchText } from "./rentals";
import { parseQuery, rankListings, suggestQuery } from "./search";

// Listings anyone can see: live, and from a seller who isn't suspended or deleted.
export const PUBLIC_LISTING: Prisma.ListingWhereInput = {
  status: "ACTIVE",
  vendor: { user: { suspendedAt: null, deletedAt: null } },
};

const withPlans = (now: Date) =>
  ({
    vendor: { include: { subscriptions: { where: { status: "ACTIVE", endsAt: { gt: now } }, select: { plan: true } } } },
  }) satisfies Prisma.ListingInclude;

export type BrowseOptions = {
  metro: string;
  category?: string;
  query?: string;
  diet?: string[];
  rentalFilters?: RentalFilters;
  proFilters?: ProfessionalFilters;
  eventFilters?: EventServiceFilters;
  // The visitor's location. With radiusMiles, listings within that distance are shown from any metro;
  // without it, the metro is browsed and listings just get a distance.
  near?: { lat: number; lng: number; radiusMiles: number | null };
};

// Browse a city or the area around the visitor. Without a search: featured (paid boost) first, then
// nearest (when we know where they are), then Pro sellers, then newest. With a search: best matches
// first, with a small lift for featured, Pro and nearby listings.
export async function browseListings({
  metro,
  category,
  query = "",
  diet = [],
  rentalFilters = {},
  proFilters = {},
  eventFilters = {},
  near,
}: BrowseOptions) {
  const now = new Date();
  const byRadius = near?.radiusMiles != null;
  const filters: Prisma.ListingWhereInput = {
    ...PUBLIC_LISTING,
    ...(category ? { category } : {}),
    // Every chosen dietary marker must be on the listing.
    AND: diet.map((tag) => ({ tags: { contains: `,${tag},` } })),
  };
  const parsed = parseQuery(query);
  const searching = parsed.terms.length > 0 || parsed.maxPriceCents != null || parsed.minPriceCents != null;

  const filteringRentals = category === "ROOM_RENTAL" && Object.values(rentalFilters).some((v) => v != null && v !== false);
  const fetched = await db.listing.findMany({
    where: { ...filters, ...(byRadius ? {} : { metro }) },
    include: withPlans(now),
    orderBy: { createdAt: "desc" },
    take: byRadius || searching || filteringRentals || Object.values(proFilters).some(Boolean) || Object.values(eventFilters).some(Boolean) ? 5000 : 200,
  });
  const distanceTo = (zip: string) => {
    const c = near && zipCoords(zip);
    return c ? milesBetween(near, c) : null;
  };
  const filteringPros = !!category && isProfessional(category) && Object.values(proFilters).some(Boolean);
  const filteringEvents = category === "EVENT_SERVICES" && Object.values(eventFilters).some(Boolean);
  const candidates = fetched.filter(
    (l) =>
      // Rounded the same way the "N mi away" label is, so a listing labelled 10 mi shows under "10 mi".
      (!byRadius || Math.round(distanceTo(l.zip) ?? Infinity) <= near!.radiusMiles!) &&
      (!filteringRentals || matchesRentalFilters(readRental(l.details), l.priceCents, rentalFilters)) &&
      (!filteringPros || matchesProfessionalFilters(readProfessional(l.details), proFilters)) &&
      (!filteringEvents || matchesEventServiceFilters(readEventService(l.details), eventFilters)),
  );
  // Rental details (space type, neighborhood, amenities) are searchable too.
  const scored = searching
    ? rankListings(
        parsed,
        candidates.map((l) => {
          const rental = l.category === "ROOM_RENTAL" ? readRental(l.details) : null;
          const pro = isProfessional(l.category) ? readProfessional(l.details) : null;
          const ev = l.category === "EVENT_SERVICES" ? readEventService(l.details) : null;
          const extra = rental ? rentalSearchText(rental) : pro ? professionalSearchText(l.category, pro) : ev ? eventServiceSearchText(ev) : "";
          return { ...l, description: `${l.description} ${extra}`, original: l };
        }),
      ).map(({ item, score }) => ({ item: item.original, score }))
    : candidates.map((item) => ({ item, score: 0 }));

  const ratings = await ratingsFor([...new Set(scored.map((s) => s.item.vendorId))]);
  const listings = scored.map(({ item, score }) => {
    const isFeatured = !!item.featuredUntil && item.featuredUntil > now;
    const isPro = item.vendor.subscriptions.some((s) => s.plan === "PRO");
    const distanceMiles = distanceTo(item.zip);
    // Nearby listings get a gentle lift in search results (about 30% less at 50 miles).
    const nearby = distanceMiles == null ? 1 : 1 / (1 + distanceMiles / 120);
    return {
      ...item,
      isFeatured,
      isPro,
      distanceMiles,
      rating: ratings.get(item.vendorId),
      score: score * (isFeatured ? 1.15 : 1) * (isPro ? 1.05 : 1) * nearby,
    };
  });
  listings.sort((a, b) =>
    searching
      ? b.score - a.score
      : Number(b.isFeatured) - Number(a.isFeatured) ||
        (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity) ||
        Number(b.isPro) - Number(a.isPro),
  );

  // Help when a search comes up short: a spelling fix, or the same search in other cities.
  let suggestion: string | null = null;
  let otherMetros: { metro: string; count: number }[] = [];
  if (searching && parsed.terms.length && listings.length < 3) {
    suggestion = suggestQuery(parsed, candidates);
    if (!listings.length) {
      const elsewhere = await db.listing.findMany({
        where: { ...filters, ...(byRadius ? {} : { metro: { not: metro } }) },
        select: { id: true, title: true, description: true, category: true, priceCents: true, priceUnit: true, tags: true, metro: true, vendor: { select: { businessName: true } } },
        take: 5000,
      });
      const counts = new Map<string, number>();
      for (const { item } of rankListings(parsed, elsewhere)) counts.set(item.metro, (counts.get(item.metro) ?? 0) + 1);
      otherMetros = [...counts].map(([m, count]) => ({ metro: m, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      if (!suggestion) suggestion = suggestQuery(parsed, elsewhere);
    }
  }

  return {
    listings,
    search: {
      active: searching,
      suggestion,
      otherMetros,
      hintedCategory: parsed.hintedCategory,
      maxPriceCents: parsed.maxPriceCents,
      minPriceCents: parsed.minPriceCents,
    },
  };
}

export type BrowseListing = Awaited<ReturnType<typeof browseListings>>["listings"][number];

// Live listings per category for the home page tiles: in the metro, or within a radius of the visitor.
export async function categoryCounts(metro: string, near?: { lat: number; lng: number; radiusMiles: number | null }) {
  const byRadius = near?.radiusMiles != null;
  const rows = await db.listing.findMany({
    where: { ...PUBLIC_LISTING, ...(byRadius ? {} : { metro }) },
    select: { category: true, zip: true },
    take: 20000,
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (byRadius) {
      const c = zipCoords(r.zip);
      if (!c || Math.round(milesBetween(near!, c)) > near!.radiusMiles!) continue;
    }
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }
  return counts;
}
