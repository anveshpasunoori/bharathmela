import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { isNewListing } from "./time";
import { milesBetween, zipCoords } from "./geo";
import { isNationwideListing, NATIONWIDE_CATEGORIES, NATIONWIDE_TAG } from "./nationwide";
import { ratingsFor } from "./reviews";
import { type CreatorFilters, creatorSearchText, matchesCreatorFilters, readCreator } from "./creators";
import { type EventServiceFilters, eventServiceSearchText, matchesEventServiceFilters, readEventService } from "./event-services";
import { type ProfessionalFilters, isProfessional, matchesProfessionalFilters, professionalSearchText, readProfessional } from "./professionals";
import { type RentalFilters, matchesRentalFilters, readRental, rentalSearchText } from "./rentals";
import { betterCategories, parseQuery, rankListings, suggestQuery } from "./search";

// Listings stay up this long after being posted or renewed, so stale ads drop off on their own.
export const LISTING_DAYS = 90;
export const listingExpiry = (from = new Date()) => new Date(from.getTime() + LISTING_DAYS * 86_400_000);

// Listings anyone can see: live, not expired, and from a seller who isn't suspended or deleted.
export function publicListing(now = new Date()): Prisma.ListingWhereInput {
  return {
    status: "ACTIVE",
    expiresAt: { gt: now },
    vendor: { user: { suspendedAt: null, deletedAt: null } },
  };
}

const withPlans = (now: Date) =>
  ({
    vendor: { include: { subscriptions: { where: { status: "ACTIVE", endsAt: { gt: now } }, select: { plan: true } } } },
    photos: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true } },
  }) satisfies Prisma.ListingInclude;

const MAX_PINNED = 2;

// Stable pseudo-random order for a listing within a given hour.
function rotation(id: string, hour: number) {
  let h = hour;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

export type BrowseOptions = {
  metro: string;
  category?: string;
  query?: string;
  diet?: string[];
  // One of the category's service types (lib/service-types), e.g. "PLUMBING".
  serviceType?: string;
  rentalFilters?: RentalFilters;
  proFilters?: ProfessionalFilters;
  eventFilters?: EventServiceFilters;
  creatorFilters?: CreatorFilters;
  // The visitor's location. With radiusMiles, listings within that distance are shown from any metro;
  // without it, the metro is browsed and listings just get a distance.
  near?: { lat: number; lng: number; radiusMiles: number | null };
  sort?: SortId;
  // Every city at once (the nationwide creators pages); metro is then ignored.
  anywhere?: boolean;
};

export const SORTS = [
  { id: "best", label: "Recommended" },
  { id: "near", label: "Nearest" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
  { id: "new", label: "Newest" },
] as const;
export type SortId = (typeof SORTS)[number]["id"];

// Browse a city or the area around the visitor. Without a search: featured (paid boost) first, then
// nearest (when we know where they are), then Pro sellers, then newest. With a search: best matches
// first, with a small lift for featured, Pro and nearby listings.
export async function browseListings({
  metro,
  category,
  query = "",
  diet = [],
  serviceType,
  rentalFilters = {},
  proFilters = {},
  eventFilters = {},
  creatorFilters = {},
  near,
  sort = "best",
  anywhere = false,
}: BrowseOptions) {
  const now = new Date();
  const byRadius = near?.radiusMiles != null;
  const filters: Prisma.ListingWhereInput = {
    ...publicListing(),
    ...(category ? { category } : {}),
    // Every chosen dietary marker, and the chosen service type, must be on the listing.
    AND: [...diet, ...(serviceType ? [serviceType] : [])].map((tag) => ({ tags: { contains: `,${tag},` } })),
  };
  const parsed = parseQuery(query, category);
  const searching = parsed.terms.length > 0 || parsed.maxPriceCents != null || parsed.minPriceCents != null;

  const filteringRentals = category === "ROOM_RENTAL" && Object.values(rentalFilters).some((v) => v != null && v !== false);
  const nationwide: Prisma.ListingWhereInput = { category: { in: NATIONWIDE_CATEGORIES }, tags: { contains: NATIONWIDE_TAG } };
  const place: Prisma.ListingWhereInput = byRadius || anywhere ? {} : { OR: [{ metro }, nationwide] };
  const fetched = await db.listing.findMany({
    where: { ...filters, ...place },
    include: withPlans(now),
    orderBy: { createdAt: "desc" },
    take: byRadius || searching || filteringRentals || Object.values(proFilters).some(Boolean) || Object.values(eventFilters).some(Boolean) || Object.values(creatorFilters).some(Boolean) ? 5000 : 200,
  });
  const distanceTo = (zip: string) => {
    const c = near && zipCoords(zip);
    return c ? milesBetween(near, c) : null;
  };
  const filteringPros = !!category && isProfessional(category) && Object.values(proFilters).some(Boolean);
  const filteringEvents = category === "EVENT_SERVICES" && Object.values(eventFilters).some(Boolean);
  const filteringCreators = category === "CREATORS" && Object.values(creatorFilters).some(Boolean);
  const candidates = fetched.filter(
    (l) =>
      // Rounded the same way the "N mi away" label is, so a listing labelled 10 mi shows under "10 mi".
      (!byRadius || isNationwideListing(l) || Math.round(distanceTo(l.zip) ?? Infinity) <= near!.radiusMiles!) &&
      (!filteringCreators || matchesCreatorFilters(readCreator(l.details), creatorFilters)) &&
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
          const creator = l.category === "CREATORS" ? readCreator(l.details) : null;
          const extra = rental ? rentalSearchText(rental) : pro ? professionalSearchText(l.category, pro) : ev ? eventServiceSearchText(ev) : creator ? creatorSearchText(creator) : "";
          return { ...l, description: `${l.description} ${extra}`, original: l };
        }),
      ).map(({ item, score }) => ({ item: item.original, score }))
    : candidates.map((item) => ({ item, score: 0 }));

  const ratings = await ratingsFor([...new Set(scored.map((s) => s.item.vendorId))]);
  const listings = scored.map(({ item, score }) => {
    const isFeatured = !!item.featuredUntil && item.featuredUntil > now;
    const isPro = item.vendor.subscriptions.some((s) => s.plan === "PRO");
    const distanceMiles = isNationwideListing(item) ? null : distanceTo(item.zip);
    // Nearby listings get a gentle lift in search results (about 30% less at 50 miles).
    const nearby = distanceMiles == null ? 1 : 1 / (1 + distanceMiles / 120);
    return {
      ...item,
      isFeatured,
      isPro,
      isNew: isNewListing(item.createdAt),
      distanceMiles,
      rating: ratings.get(item.vendorId),
      score: score * (isFeatured ? 1.15 : 1) * (isPro ? 1.05 : 1) * nearby,
    };
  });
  // At most MAX_PINNED sponsored listings sit at the top, so paid placement never crowds out the page.
  // When more sellers have paid, they take turns: the pick rotates every hour.
  const hour = Math.floor(Date.now() / 3_600_000);
  const pinned = new Set(
    listings
      .filter((l) => l.isFeatured)
      .sort((a, b) => rotation(a.id, hour) - rotation(b.id, hour))
      .slice(0, MAX_PINNED)
      .map((l) => l.id),
  );
  const recommended = (a: (typeof listings)[number], b: (typeof listings)[number]) =>
    searching
      ? b.score - a.score
      : Number(pinned.has(b.id)) - Number(pinned.has(a.id)) ||
        (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity) ||
        Number(b.isPro) - Number(a.isPro);
  // Listings without a price go last when sorting by price.
  const price = (l: (typeof listings)[number], dir: 1 | -1) => (l.priceCents == null ? Infinity : dir * l.priceCents);
  const comparators: Record<SortId, (a: (typeof listings)[number], b: (typeof listings)[number]) => number> = {
    best: recommended,
    near: (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity) || recommended(a, b),
    price_asc: (a, b) => price(a, 1) - price(b, 1) || recommended(a, b),
    price_desc: (a, b) => price(a, -1) - price(b, -1) || recommended(a, b),
    rating: (a, b) =>
      (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0) || recommended(a, b),
    new: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  };
  listings.sort(comparators[sort] ?? recommended);

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
    where: { ...publicListing(), ...(byRadius ? {} : { OR: [{ metro }, { category: { in: NATIONWIDE_CATEGORIES }, tags: { contains: NATIONWIDE_TAG } }] }) },
    select: { category: true, zip: true, tags: true },
    take: 20000,
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (byRadius && !isNationwideListing(r)) {
      const c = zipCoords(r.zip);
      if (!c || Math.round(milesBetween(near!, c)) > near!.radiusMiles!) continue;
    }
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }
  return counts;
}

// When someone searches inside a category for something that belongs elsewhere ("pujari" while in Home
// Food), the category to take them to, or null to stay. Words that point at another category decide it;
// with no such words, a search with no results here goes where its matches are.
export async function categoryForSearch(opts: { metro: string; category: string; query: string; near?: BrowseOptions["near"] }) {
  const parsed = parseQuery(opts.query, opts.category);
  if (!parsed.terms.length) return null;
  const better = betterCategories(parsed, opts.category);
  if (better.length === 1) return better[0];
  // Ambiguous words, or none: count where the matches are, nearby first.
  const { listings } = await browseListings({ metro: opts.metro, query: opts.query, near: opts.near });
  const counts = new Map<string, number>();
  for (const l of listings) counts.set(l.category, (counts.get(l.category) ?? 0) + 1);
  if (better.length > 1) return [...better].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0];
  if (counts.get(opts.category)) return null;
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  return top?.[0] ?? null;
}

// Which of these listings the visitor has saved, for the hearts on listing cards.
export async function savedListingIds(userId: string | undefined, listingIds: string[]) {
  if (!userId || !listingIds.length) return new Set<string>();
  const rows = await db.favorite.findMany({ where: { userId, listingId: { in: listingIds } }, select: { listingId: true } });
  return new Set(rows.map((r) => r.listingId));
}
