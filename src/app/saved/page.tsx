import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HeartIcon } from "@/components/HeartIcon";
import { ListingCard } from "@/components/ListingCard";
import { SavedSearchList } from "@/components/SavedSearchList";
import { BellIcon } from "@/components/SaveSearchButton";
import { SortSelect } from "@/components/SortSelect";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { ratingsFor } from "@/lib/reviews";
import { newMatchCounts } from "@/lib/saved-searches";
import { isNewListing, timeAgo } from "@/lib/time";
import { toggleSaved } from "../actions/buyer";

export const metadata = { title: "Saved listings", robots: { index: false } };

const SORTS = [
  { id: "best", label: "Recently saved" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated sellers" },
] as const;

// Where to start when nothing is saved yet.
const STARTERS = ["FOOD", "TUTORING", "EVENT_SERVICES", "ROOM_RENTAL"];

// The buyer's shortlist, laid out like wishlists on Airbnb and saved homes on Zillow: big photos with a
// filled heart to unsave, filter by category, sort, when each was saved, and what's no longer available.
// A second tab holds saved searches and their email alerts.
export default async function SavedPage({ searchParams }: { searchParams: Promise<{ cat?: string; sort?: string; tab?: string }> }) {
  const user = await requireUser("/saved");
  const params = await searchParams;
  const saved = await db.favorite.findMany({
    where: { userId: user.id },
    include: { listing: { include: { vendor: true, photos: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  // Listings that were removed, hidden or expired stay on the page so the buyer knows what happened.
  const live = await db.listing.findMany({ where: { id: { in: saved.map((s) => s.listingId) }, ...publicListing() }, select: { id: true } });
  const liveIds = new Set(live.map((l) => l.id));
  const ratings = await ratingsFor([...new Set(saved.map((s) => s.listing.vendorId))]);

  const available = saved.filter((s) => liveIds.has(s.listingId));
  const gone = saved.filter((s) => !liveIds.has(s.listingId));
  const counts = new Map<string, number>();
  for (const s of available) counts.set(s.listing.category, (counts.get(s.listing.category) ?? 0) + 1);
  const cat = params.cat && counts.has(params.cat) ? params.cat : undefined;
  const sort = SORTS.find((x) => x.id === params.sort)?.id ?? "best";

  const price = (cents: number | null, dir: 1 | -1) => (cents == null ? Infinity : dir * cents);
  const shown = available
    .filter((s) => !cat || s.listing.category === cat)
    .sort((a, b) =>
      sort === "price_asc" ? price(a.listing.priceCents, 1) - price(b.listing.priceCents, 1)
      : sort === "price_desc" ? price(a.listing.priceCents, -1) - price(b.listing.priceCents, -1)
      : sort === "rating" ? (ratings.get(b.listing.vendorId)?.average ?? 0) - (ratings.get(a.listing.vendorId)?.average ?? 0)
      : 0,
    );
  const sellers = new Set(available.map((s) => s.listing.vendorId)).size;
  const chipHref = (c?: string) => {
    const p = new URLSearchParams();
    if (c) p.set("cat", c);
    if (sort !== "best") p.set("sort", sort);
    const qs = p.toString();
    return qs ? `/saved?${qs}` : "/saved";
  };
  const chip = (on: boolean) =>
    `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border py-1 pl-1.5 pr-3.5 text-sm font-medium transition ${
      on ? "border-brand bg-brand-soft text-brand" : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
    }`;

  const searches = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const newCounts = await newMatchCounts(searches);
  const totalNew = [...newCounts.values()].reduce((a, b) => a + b, 0);
  const tab = params.tab === "searches" || (params.tab !== "listings" && !saved.length) ? "searches" : "listings";
  const tabLink = (on: boolean) =>
    `-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-sm font-semibold transition ${
      on ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-800"
    }`;

  if (!saved.length && !searches.length) {
    return (
      <div className="mx-auto max-w-2xl py-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-50 ring-8 ring-rose-50/50">
          <HeartIcon filled className="h-10 w-10" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Save what you like</h1>
        <p className="mx-auto mt-2 max-w-md text-stone-600">
          Tap the <HeartIcon filled={false} className="inline h-4 w-4 -translate-y-px text-rose-500" /> on any listing to keep it here. Compare tiffins, tutors or rooms side by side and
          come back when you&apos;re ready to call. Or tap <b>Save search</b> on any results page to get emailed when something new matches.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STARTERS.map((id) => (
            <Link key={id} href={`/?category=${id}`} className="card flex flex-col items-center gap-2 p-4 text-sm font-medium transition hover:shadow-md">
              <CategoryIcon id={id} size={56} className="h-14 w-14" />
              {categoryLabel(id)}
            </Link>
          ))}
        </div>
        <Link href="/" className="btn mt-6">Browse all categories</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Saved</h1>
        <nav className="flex gap-6 border-b border-stone-200" aria-label="Saved">
          <Link href="/saved?tab=listings" className={tabLink(tab === "listings")} aria-current={tab === "listings" ? "page" : undefined}>
            <HeartIcon filled={tab === "listings"} className="h-4 w-4" />
            Listings <span className="font-normal text-stone-500">{available.length}</span>
          </Link>
          <Link href="/saved?tab=searches" className={tabLink(tab === "searches")} aria-current={tab === "searches" ? "page" : undefined}>
            <BellIcon filled={tab === "searches"} />
            Searches <span className="font-normal text-stone-500">{searches.length}</span>
            {totalNew > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[11px] leading-none text-white">{totalNew} new</span>}
          </Link>
        </nav>
      </div>

      {tab === "searches" ? (
        <SavedSearchList searches={searches} newCounts={newCounts} />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-stone-600">
                {available.length} listing{available.length === 1 ? "" : "s"} from {sellers} seller{sellers === 1 ? "" : "s"}
                {gone.length > 0 && <> · {gone.length} no longer available</>}
              </p>
            </div>
            {available.length > 1 && <SortSelect options={SORTS} value={sort} />}
          </div>

          {counts.size > 1 && (
            <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filter saved listings by category">
              <Link href={chipHref()} className={`${chip(!cat)} pl-3.5`} aria-current={!cat ? "page" : undefined}>
                All <span className={!cat ? "text-brand/70" : "text-stone-500"}>{available.length}</span>
              </Link>
              {CATEGORIES.filter((c) => counts.has(c.id)).map((c) => (
                <Link key={c.id} href={chipHref(c.id)} className={chip(cat === c.id)} aria-current={cat === c.id ? "page" : undefined}>
                  <CategoryIcon id={c.id} size={24} className="h-6 w-6" />
                  {c.label}
                  <span className={cat === c.id ? "text-brand/70" : "text-stone-500"}>{counts.get(c.id)}</span>
                </Link>
              ))}
            </nav>
          )}

          {shown.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map(({ listing, createdAt }) => (
                <div key={listing.id} className="relative">
                  <ListingCard
                    saved
                    listing={{
                      ...listing,
                      vendor: { ...listing.vendor, subscriptions: [] },
                      isFeatured: false,
                      isPro: false,
                      rating: ratings.get(listing.vendorId),
                      score: 0,
                      distanceMiles: null,
                      isNew: isNewListing(listing.createdAt),
                    }}
                  />
                  <p className="mt-1.5 px-1 text-xs text-stone-500">Saved {timeAgo(createdAt, now.getTime())}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="card text-center text-stone-600">
              {available.length ? "Nothing saved here right now." : <>No saved listings yet. Tap the heart on any listing to keep it here.</>}
            </p>
          )}

          {gone.length > 0 && (
            <section className="space-y-2 pt-2">
              <h2 className="text-sm font-semibold text-stone-500">No longer available</h2>
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                {gone.map(({ listing }) => (
                  <li key={listing.id} className="flex items-center gap-3 p-3">
                    <CategoryIcon id={listing.category} size={40} className="h-10 w-10 opacity-50 grayscale" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-500 line-through decoration-stone-300">{listing.title}</p>
                      <p className="text-xs text-stone-500">
                        {listing.vendor.businessName} · removed or expired ·{" "}
                        <Link href={`/?category=${listing.category}`} className="font-medium text-brand hover:underline">
                          Find similar
                        </Link>
                      </p>
                    </div>
                    <form action={toggleSaved.bind(null, listing.id)}>
                      <button className="rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
