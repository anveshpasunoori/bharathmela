import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_SEARCH_RADIUS } from "@/lib/browse-params";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { upcomingEvents } from "@/lib/event-data";
import { browseListings, categoryCounts, publicListing, savedListingIds } from "@/lib/listings";
import { selectFestivalCover } from "@/lib/festival-cover";
import { popularMarketIntents } from "@/lib/market-intent-data";
import { intentDestination } from "@/lib/market-intents";
import { METROS, metroName, metroTimeZone } from "@/lib/metros";
import { listingSubcategories, subcategoriesFor, subcategoryLabel } from "@/lib/subcategories";
import { listingSearchCenter, resolveLocation } from "@/lib/user-location";
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
  const { metro } = where;
  const { lat, lng } = listingSearchCenter(where);
  const near = { lat, lng, radiusMiles: DEFAULT_SEARCH_RADIUS };
  const [{ listings }, viewer] = await Promise.all([browseListings({ metro, near, sort: "best" }), getCurrentUser()]);
  const picked = pickFeatured(listings);
  const saved = await savedListingIds(viewer?.id, picked.map((l) => l.id));
  return <FeaturedBusinesses listings={picked} savedIds={saved} ownVendorId={viewer?.vendor?.id} allHref={allHref} where={label} />;
}

async function Events({ metro }: { metro: string }) {
  const events = await upcomingEvents({ metro, take: 6 });
  return <CommunityEvents events={events} allHref={`/events?metro=${metro}`} where={`in ${metroName(metro)}`} />;
}

// The home page for visitors who haven't searched yet. Searches, categories and cities open the existing
// browse pages, so their URLs, filters and SEO stay as they were.
export async function HomePage() {
  const where = await resolveLocation();
  const { place, guess, metro } = where;
  const localPlace = place ?? guess;
  const { lat, lng, city } = listingSearchCenter(where);
  const near = { lat, lng, radiusMiles: DEFAULT_SEARCH_RADIUS };
  const label = `within ${DEFAULT_SEARCH_RADIUS} mi of ${city}`;
  const allHref = `/?radius=${DEFAULT_SEARCH_RADIUS}`;
  const hrefFor = (id: string) => `/?category=${id}&radius=${DEFAULT_SEARCH_RADIUS}`;
  const locations: SearchLocation[] = [
    ...(localPlace ? [{ value: "near", label: `Near ${localPlace.city}, ${localPlace.state}` }] : []),
    ...METROS.map((m) => ({ value: m.id, label: `${m.name}, ${m.state}` })),
  ];
  const now = new Date();
  const timeZone = metroTimeZone(metro);
  const festivalCover = selectFestivalCover(now, timeZone);
  const [popular, counts, activity] = await Promise.all([
    popularSuggestions(metro), categoryCounts(metro, near), popularMarketIntents(metro),
  ]);
  const shortcuts = activity.rows.map(({ action }) => intentDestination(action, metro));

  return (
    // Full width, out of the layout's centered column.
    <div className="-mb-6 -mt-6 ml-[calc(50%-50vw)] w-screen sm:-mb-8 sm:-mt-8">
      <HeroSection shortcuts={shortcuts} shortcutLabel={activity.scope === "local" ? "Popular in your area" : "Popular on BharathMela"} suggestions={allSuggestions()} popular={popular} locations={locations} defaultLocation={localPlace ? "near" : metro} exploreHref={allHref} festivalCover={festivalCover} />
      <CategorySection hrefFor={hrefFor} allHref={allHref} counts={counts} />
      <Suspense fallback={<FeaturedSkeleton />}>
        <Featured where={where} label={label} allHref={allHref} />
      </Suspense>
      <PostRequestBanner />
      <Suspense fallback={<EventsSkeleton />}>
        <Events metro={metro} />
      </Suspense>
      <TrustIndicators />
    </div>
  );
}
