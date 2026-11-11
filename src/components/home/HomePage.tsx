import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicEventWhere, upcomingEvents } from "@/lib/event-data";
import { browseListings, categoryCounts, publicListing, savedListingIds } from "@/lib/listings";
import { localFestivalCover, selectFestivalCover } from "@/lib/festival-cover";
import { METROS, metroName, metroTimeZone } from "@/lib/metros";
import { cityCategoryPath, cityPath } from "@/lib/seo";
import { listingSubcategories, subcategoriesFor, subcategoryLabel } from "@/lib/subcategories";
import { resolveLocation } from "@/lib/user-location";
import { CategorySection, HOME_CATEGORIES } from "./CategorySection";
import { CommunityEvents, EventsSkeleton } from "./CommunityEvents";
import { FeaturedBusinesses, FeaturedSkeleton, pickFeatured } from "./FeaturedBusinesses";
import { HeroSection } from "./HeroSection";
import { PostRequestBanner } from "./PostRequestBanner";
import type { SearchLocation, SearchSuggestion } from "./SmartSearch";
import { TrustIndicators } from "./TrustIndicators";

type Where = Awaited<ReturnType<typeof resolveLocation>>;

// Every category and subcategory, for the search box's suggestions.
function allSuggestions(): SearchSuggestion[] {
  return CATEGORIES.flatMap((c) => {
    const subs = subcategoriesFor(c.id);
    return [
      { label: c.label, category: c.id, categoryLabel: "Category", params: { category: c.id } },
      ...(subs?.options ?? []).map((o) => ({ label: o.label, category: c.id, categoryLabel: c.label, params: { category: c.id, [subs!.param]: o.id } })),
    ];
  });
}

// "Popular searches": the subcategories with the most live listings here, then the home categories.
async function popularSuggestions(metro: string): Promise<SearchSuggestion[]> {
  const rows = await db.listing.findMany({ where: { ...publicListing(), metro }, select: { category: true, tags: true, details: true }, take: 3000 });
  const counts = new Map<string, { category: string; id: string; n: number }>();
  for (const r of rows)
    for (const id of listingSubcategories(r)) {
      const k = `${r.category}/${id}`;
      counts.set(k, { category: r.category, id, n: (counts.get(k)?.n ?? 0) + 1 });
    }
  const top = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((s) => {
    const subs = subcategoriesFor(s.category)!;
    return { label: subcategoryLabel(s.category, s.id) ?? s.id, category: s.category, categoryLabel: categoryLabel(s.category), params: { category: s.category, [subs.param]: s.id } };
  });
  const fill = HOME_CATEGORIES.map((c) => ({ label: categoryLabel(c.id), category: c.id, categoryLabel: "Category", params: { category: c.id } }));
  return [...top, ...fill.filter((f) => !top.some((t) => t.category === f.category))].slice(0, 6);
}

async function Featured({ where, label, allHref }: { where: Where; label: string; allHref: string }) {
  const { place, metro } = where;
  const near = place ? { lat: place.lat, lng: place.lng, radiusMiles: null } : undefined;
  const [{ listings }, viewer] = await Promise.all([browseListings({ metro, near, sort: "best" }), getCurrentUser()]);
  const picked = pickFeatured(listings);
  const saved = await savedListingIds(viewer?.id, picked.map((l) => l.id));
  return <FeaturedBusinesses listings={picked} savedIds={saved} ownVendorId={viewer?.vendor?.id} allHref={allHref} where={label} />;
}

async function Events({ metro, label }: { metro: string; label: string }) {
  const events = await upcomingEvents({ metro, take: 6 });
  return <CommunityEvents events={events} allHref="/events" where={label} />;
}

async function homepageFestivalCover(metro: string, now = new Date()) {
  const timeZone = metroTimeZone(metro);
  const scheduled = selectFestivalCover(now, timeZone);
  if (scheduled) return scheduled;

  const event = await db.event.findFirst({
    where: {
      ...publicEventWhere(now),
      metro,
      OR: [{ type: "FESTIVAL" }, { festival: { not: "" } }],
      // Eight elapsed days is a coarse query bound. The cover helper uses local calendar days.
      startsAt: { lte: new Date(now.getTime() + 8 * 86_400_000) },
    },
    select: { festival: true, startsAt: true },
    orderBy: { startsAt: "asc" },
  });
  return event ? localFestivalCover(event, now, timeZone) : null;
}

// The home page for visitors who haven't searched yet. Searches, categories and cities open the existing
// browse pages, so their URLs, filters and SEO stay as they were.
export async function HomePage() {
  const where = await resolveLocation();
  const { place, metro } = where;
  const near = place ? { lat: place.lat, lng: place.lng, radiusMiles: 25 } : undefined;
  const label = place ? `near ${place.city}` : `in ${metroName(metro)}`;
  const allHref = place ? "/?radius=25" : cityPath(metro);
  const hrefFor = (id: string) => (place ? `/?category=${id}&radius=25` : cityCategoryPath(metro, id));
  const locations: SearchLocation[] = [
    ...(place ? [{ value: "near", label: `Near ${place.city}, ${place.state}` }] : []),
    ...METROS.map((m) => ({ value: m.id, label: `${m.name}, ${m.state}` })),
  ];
  const [popular, counts, festivalCover] = await Promise.all([popularSuggestions(metro), categoryCounts(metro, near), homepageFestivalCover(metro)]);

  return (
    // Full width, out of the layout's centered column.
    <div className="-mb-6 -mt-6 ml-[calc(50%-50vw)] w-screen sm:-mb-8 sm:-mt-8">
      <HeroSection suggestions={allSuggestions()} popular={popular} locations={locations} defaultLocation={place ? "near" : metro} exploreHref={allHref} festivalCover={festivalCover} />
      <CategorySection hrefFor={hrefFor} allHref={allHref} counts={counts} />
      <Suspense fallback={<FeaturedSkeleton />}>
        <Featured where={where} label={label} allHref={allHref} />
      </Suspense>
      <PostRequestBanner />
      <Suspense fallback={<EventsSkeleton />}>
        <Events metro={metro} label={label} />
      </Suspense>
      <TrustIndicators cities={METROS.length} />
    </div>
  );
}
