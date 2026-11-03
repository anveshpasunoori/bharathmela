import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { FilterBar, type FilterDef } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { RentalTabs } from "@/components/RentalTabs";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { SortSelect } from "@/components/SortSelect";
import { syncExpirations } from "@/lib/billing";
import { CATEGORIES, DIET_TAGS, categoryLabel, tagLabel } from "@/lib/constants";
import { upcomingEvents } from "@/lib/event-data";
import { metroFor } from "@/lib/geo";
import { getCurrentUser } from "@/lib/auth";
import { SORTS, type SortId, browseListings, categoryCounts, categoryForSearch, savedListingIds } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { EVENT_SERVICES, OCCASIONS, RENTAL_ITEMS } from "@/lib/event-services";
import { LANGUAGES, SPECIALTIES, isProfessional } from "@/lib/professionals";
import { SPACE_TYPES } from "@/lib/rentals";
import { SERVICE_TYPES, hasServiceTypes, typeWording } from "@/lib/service-types";
import { RADII, parseFilters, searchQueryString } from "@/lib/browse-params";
import { db } from "@/lib/db";
import { sameLocation } from "@/lib/saved-searches";
import { CATEGORY_PITCH, cityCategoryPath, cityPath } from "@/lib/seo";
import { resolveLocation } from "@/lib/user-location";
import { FarNote } from "@/components/FarNote";

const POPULAR = ["Biryani", "Tiffin", "Bharatanatyam", "Pooja", "Math tutor", "Mehndi", "Room for rent"];

// A one-line reminder under results in categories where the seller needs a license.
const LICENSE_TIPS: Record<string, string> = {
  LEGAL: "Always check a lawyer's license with the state bar before hiring.",
  REALTOR: "Always check a realtor's license with your state's real estate department before hiring.",
  HOME_SERVICES: "Check a contractor's license with your state's licensing board and ask for proof of insurance before work starts.",
  TAX_FINANCE: "Ask for the preparer's IRS PTIN, and never let a refund go to the preparer's account.",
  AUTO: "Get a written estimate before any repair. Driving instructors should show a state license.",
  GARAGE_SALE: "Check baby gear and electronics for recalls at cpsc.gov, and pay in cash or by app when you pick up.",
};

export type BrowseParams = {
  metro?: string;
  category?: string;
  q?: string;
  diet?: string;
  type?: string;
  deleted?: string;
  space?: string;
  maxRent?: string;
  by?: string;
  pbath?: string;
  furn?: string;
  pets?: string;
  spec?: string;
  lang?: string;
  free?: string;
  svc?: string;
  item?: string;
  occ?: string;
  ins?: string;
  radius?: string;
  sort?: string;
  from?: string;
  stay?: string;
  ss?: string;
};

// The browse page: category tiles, or listings for a category or search. Rendered by the home page and
// by the city (/in/[metro]) and city-category (/in/[metro]/[category]) pages search engines index.
export async function BrowsePage({ params }: { params: BrowseParams }) {
  // With a saved location and no city picked, browse "near you" by radius across metros.
  const { place, metro, far } = await resolveLocation(params.metro);
  const nearMode = !!place && !isMetro(params.metro);
  const radius = RADII.includes(Number(params.radius)) ? Number(params.radius) : 25;
  const placeMetro = place ? metroFor(place) : null;
  const { category, q, diet, serviceType, rentalFilters, proFilters, eventFilters } = parseFilters(params);
  await syncExpirations();
  const sort: SortId = SORTS.find((x) => x.id === params.sort && (x.id !== "near" || place))?.id ?? "best";
  const near = place ? { lat: place.lat, lng: place.lng, radiusMiles: nearMode ? radius : null } : undefined;
  // Searching for something that belongs in another category ("pujari" while in Home Food) moves there.
  // `stay` is set when the visitor asked to search the category they were in after all.
  if (category && q && params.stay !== "1") {
    const target = await categoryForSearch({ metro, category, query: q, near });
    if (target) {
      const p = new URLSearchParams(nearMode ? { radius: String(radius) } : { metro });
      p.set("category", target);
      p.set("q", q);
      if (sort !== "best") p.set("sort", sort);
      p.set("from", category);
      redirect(`/?${p}`);
    }
  }
  const movedFrom = CATEGORIES.some((c) => c.id === params.from) && params.from !== category ? params.from : undefined;

  // The home page shows categories first; listings appear once a category is picked or a search is made.
  const showingListings = !!(category || q);
  const [{ listings, search }, events, counts] = await Promise.all([
    showingListings
      ? browseListings({ metro, category, query: q, diet, serviceType, rentalFilters, proFilters, eventFilters, near, sort })
      : Promise.resolve({ listings: [], search: { active: false, suggestion: null, otherMetros: [], hintedCategory: undefined, maxPriceCents: undefined, minPriceCents: undefined } }),
    showingListings ? Promise.resolve([]) : upcomingEvents({ metro, take: 4 }),
    showingListings ? Promise.resolve(new Map<string, number>()) : categoryCounts(metro, near),
  ]);
  // Hearts on the cards: which results the visitor saved; none on a seller's own listings.
  const viewer = await getCurrentUser();
  const savedIds = await savedListingIds(viewer?.id, listings.map((l) => l.id));
  // "Save search": whether this search, at this location, is already saved. Opening a saved search
  // (marked with `ss`) resets its count of new listings.
  const searchQuery = searchQueryString(params);
  const here = { metro, nearLat: nearMode ? place!.lat : null, nearLng: nearMode ? place!.lng : null, radiusMiles: nearMode ? radius : null };
  const mySearches = viewer && showingListings ? await db.savedSearch.findMany({ where: { userId: viewer.id } }) : [];
  const searchSaved = mySearches.some((s) => s.params === searchQuery && sameLocation(s, here));
  if (viewer && params.ss) await db.savedSearch.updateMany({ where: { id: params.ss, userId: viewer.id }, data: { viewedAt: new Date() } });
  const pageQuery = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  const where = nearMode ? `within ${radius} mi of ${place!.city}` : `in ${metroName(metro)}`;

  // Links keep the current location mode: "near you" (radius) or a picked metro.
  const locationParams = (city?: string) => {
    const p = new URLSearchParams();
    if (city) p.set("metro", city);
    else if (nearMode) p.set("radius", String(radius));
    else p.set("metro", metro);
    return p;
  };
  // Plain browsing in a city uses its clean page (/in/jacksonville/home-food), which search engines index.
  const home = nearMode ? `/?${locationParams()}` : cityPath(metro);
  const href = (cat?: string, dietTags: string[] = [], query = q, city?: string) => {
    const cleanCity = city ?? (nearMode ? undefined : metro);
    if (cat && !query && !dietTags.length && cleanCity) return cityCategoryPath(cleanCity, cat);
    const p = locationParams(city);
    if (cat) p.set("category", cat);
    if (query) p.set("q", query);
    if (cat === "FOOD" && dietTags.length) p.set("diet", dietTags.join(","));
    return `/?${p}`;
  };
  const locationInputs = nearMode ? (
    <input type="hidden" name="radius" value={radius} />
  ) : (
    <input type="hidden" name="metro" value={metro} />
  );
  const categoryInfo = CATEGORIES.find((c) => c.id === category);

  // The filter bar under the search box: distance, then the filters for this category.
  const pick = (key: string, label: string, anyLabel: string, param: string, opts: readonly { id: string; label: string }[], current?: string): FilterDef => ({
    kind: "choice", key, label,
    options: [{ label: anyLabel, params: { [param]: null } }, ...opts.map((o) => ({ label: o.label, params: { [param]: o.id } }))],
    selected: current ? opts.findIndex((o) => o.id === current) + 1 || null : null,
  });
  const filterBar: FilterDef[] = [];
  if (place) {
    const options = [
      ...RADII.map((r) => ({ label: `Within ${r} mi`, params: { radius: String(r), metro: null } })),
      // A whole metro only counts as local when it's nearby; a far one stays in the top-bar picker.
      ...(far ? [] : [{ label: `All of ${metroName(metro)}`, params: { metro, radius: null } }]),
    ];
    filterBar.push({
      kind: "choice", key: "distance", label: "Distance", options,
      selected: nearMode ? RADII.indexOf(radius) : far ? null : RADII.length,
      defaultIndex: RADII.indexOf(25),
    });
  }
  if (category && hasServiceTypes(category)) {
    filterBar.push(pick("type", typeWording(category).filter, typeWording(category).any, "type", SERVICE_TYPES[category], serviceType));
  }
  if (category === "FOOD") {
    filterBar.push({ kind: "multi", key: "diet", param: "diet", label: "Dietary", options: DIET_TAGS, selected: diet });
  }
  if (category === "ROOM_RENTAL") {
    filterBar.push(
      pick("space", "Space type", "Any space", "space", SPACE_TYPES, rentalFilters.space),
      { kind: "max", key: "rent", param: "maxRent", label: "Rent", suffix: "per month", value: rentalFilters.maxRent ? rentalFilters.maxRent / 100 : null, presets: [800, 1000, 1200, 1500, 2000, 2500] },
      { kind: "date", key: "by", param: "by", label: "Move-in date", prefix: "By", value: rentalFilters.availableBy ?? null },
      {
        kind: "checks", key: "more", label: "More",
        items: [
          { param: "pbath", label: "Private bath", checked: !!rentalFilters.privateBath },
          { param: "furn", label: "Furnished", checked: !!rentalFilters.furnished },
          { param: "pets", label: "Pets allowed", checked: !!rentalFilters.pets },
        ],
      },
    );
  }
  if (category && isProfessional(category)) {
    filterBar.push(
      pick("spec", category === "LEGAL" ? "Practice area" : "Service", category === "LEGAL" ? "Any practice area" : "Any service", "spec", SPECIALTIES[category], proFilters.specialty),
      pick("lang", "Language", "Any language", "lang", LANGUAGES.map((l) => ({ id: l, label: `Speaks ${l}` })), proFilters.language),
      { kind: "toggle", key: "free", param: "free", label: "Free consultation", on: !!proFilters.freeConsult },
    );
  }
  if (category === "EVENT_SERVICES") {
    filterBar.push(
      pick("svc", "Service", "Any service", "svc", EVENT_SERVICES, eventFilters.service),
      pick("item", "Rental item", "Any rental item", "item", RENTAL_ITEMS, eventFilters.item),
      pick("occ", "Occasion", "Any occasion", "occ", OCCASIONS, eventFilters.occasion),
      { kind: "toggle", key: "ins", param: "ins", label: "Insured", on: !!eventFilters.insured },
    );
  }

  return (
    <div className="space-y-6">
      {params.deleted && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Your account has been deleted.</p>
      )}
      <section className={showingListings ? "space-y-3" : "space-y-3 rounded-xl bg-gradient-to-br from-brand-soft to-white p-5 ring-1 ring-orange-100 sm:p-8"}>
        {showingListings ? (
          <div>
            <Link href={home} className="text-sm text-stone-500 hover:text-brand">← All categories</Link>
            <h1 className="mt-1 flex items-center gap-3 text-xl font-bold sm:text-2xl">
              {categoryInfo ? (
                <>
                  <CategoryIcon id={categoryInfo.id} size={44} className="h-10 w-10 sm:h-11 sm:w-11" />
                  <span>
                    {categoryInfo.label}{" "}
                    <span className="font-semibold text-stone-500">{nearMode ? `near ${place!.city}` : `in ${metroName(metro)}`}</span>
                  </span>
                </>
              ) : (
                <>Results for &ldquo;{q}&rdquo;</>
              )}
            </h1>
            {categoryInfo && !q && CATEGORY_PITCH[categoryInfo.id] && (
              <p className="mt-1 text-sm text-stone-600">
                {CATEGORY_PITCH[categoryInfo.id]} from the Indian community {where}.
              </p>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isMetro(params.metro) ? `Indian home businesses in ${metroName(metro)}` : "Home businesses from our community, near you"}
            </h1>
            <p className="mt-1 text-stone-600">Home food, tutors, pujaris, event vendors, rooms and more {where}.</p>
          </div>
        )}
        <form className="flex gap-2" role="search">
          {locationInputs}
          {category && <input type="hidden" name="category" value={category} />}
          {diet.length > 0 && <input type="hidden" name="diet" value={diet.join(",")} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            className="input flex-1"
            placeholder={categoryInfo ? `Search ${categoryInfo.label.toLowerCase()}…` : "Try “biryani”, “pooja”, “photographer”"}
            aria-label="Search listings"
          />
          <button className="btn">Search</button>
        </form>
        {!showingListings && (
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
            Popular:
            {POPULAR.map((term) => (
              <Link key={term} href={href(undefined, [], term)} className="rounded-full bg-white px-2.5 py-0.5 text-stone-700 ring-1 ring-stone-200 hover:text-brand">
                {term}
              </Link>
            ))}
          </p>
        )}
        {showingListings && <FilterBar filters={filterBar} clearHref={href(category, [], q)} />}
        {place && !showingListings && (
          // Distance from the visitor's location (set in the top bar).
          <nav className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 text-sm" aria-label="Distance">
            <span className="shrink-0 text-stone-500">Within</span>
            {RADII.map((r) => {
              const p = new URLSearchParams();
              p.set("radius", String(r));
              if (category) p.set("category", category);
              if (q) p.set("q", q);
              const on = nearMode && radius === r;
              return (
                <Link key={r} href={`/?${p}`} className={`shrink-0 rounded-full px-3 py-1 ring-1 ${on ? "bg-brand text-white ring-brand" : "bg-white text-stone-700 ring-stone-200"}`}>
                  {r} mi
                </Link>
              );
            })}
            {/* A whole metro only counts as local when it's nearby; a far one stays in the top-bar picker. */}
            {!far && (
              <Link href={href(category, diet, q, metro)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 ring-1 ${!nearMode ? "bg-brand text-white ring-brand" : "bg-white text-stone-700 ring-stone-200"}`}>
                All of {metroName(metro)}
              </Link>
            )}
          </nav>
        )}
        {!nearMode && <FarNote far={far} metro={metro} />}
      </section>

      {!showingListings && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">What are you looking for?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <Link key={c.id} href={href(c.id)} className="card flex items-center gap-3 p-3 transition hover:shadow-md hover:ring-1 hover:ring-brand/30 sm:p-4">
                  <CategoryIcon id={c.id} size={56} className="h-12 w-12 sm:h-14 sm:w-14" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight sm:text-base">{c.label}</span>
                    <span className="text-xs text-stone-500">{n ? `${n} listing${n === 1 ? "" : "s"}` : "Be the first"}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
            <span>
              Need something done? <Link href="/requests/new" className="font-semibold text-brand">Post what you need and get quotes</Link>
            </span>
            <span>
              Need a room? <Link href={`/rooms-wanted/new?metro=${metro}`} className="font-semibold text-brand">Post what you&apos;re looking for</Link>
            </span>
          </p>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href={`/events?metro=${metro}`} className="text-sm font-semibold text-brand">See all →</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {showingListings && (
        // One scrollable row on phones instead of a wall of wrapped chips.
        <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm" aria-label="Categories">
          {/* The current category first, so it's visible without scrolling the row. */}
          {[...CATEGORIES].sort((a, b) => Number(b.id === category) - Number(a.id === category)).map((c) => (
            <Link
              key={c.id}
              href={href(c.id)}
              aria-current={category === c.id ? "page" : undefined}
              className={`badge shrink-0 whitespace-nowrap px-3 py-1.5 ${category === c.id ? "bg-brand text-white" : "bg-white ring-1 ring-stone-200"}`}
            >
              {c.icon} {c.label}
            </Link>
          ))}
        </nav>
      )}

      {category && LICENSE_TIPS[category] && <p className="text-xs text-stone-500">{LICENSE_TIPS[category]}</p>}

      {category === "ROOM_RENTAL" && (
        <div className="space-y-3">
          <RentalTabs metro={metro} active="offered" />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
            <span>Looking for a room? Post what you need and let owners come to you.</span>
            <Link href={`/rooms-wanted/new?metro=${metro}`} className="btn py-1.5">I need a place to live</Link>
          </div>
        </div>
      )}

      {(q || category) && (
        <div className="space-y-1 text-sm text-stone-600">
          {listings.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SortSelect options={SORTS.filter((x) => x.id !== "near" || place)} value={sort} />
              <span className="text-xs text-stone-500" title="Sponsored listings paid to appear first. Pro sellers pay for a higher spot in Recommended.">
                Recommended order includes paid placement · <Link href="/pricing" className="underline">how it works</Link>
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              {listings.length} result{listings.length === 1 ? "" : "s"}
              {q && <> for &ldquo;{q}&rdquo;</>}
              {category && <> in {categoryLabel(category)}</>}
              {diet.length > 0 && <> · {diet.map(tagLabel).join(", ")}</>}
              {search.maxPriceCents != null && <> · up to {formatUSD(search.maxPriceCents)}</>}
              {search.minPriceCents != null && <> · from {formatUSD(search.minPriceCents)}</>}
              {" · "}
              <Link href={home} className="text-brand">Clear</Link>
            </p>
            <SaveSearchButton query={pageQuery} saved={searchSaved} />
          </div>
          {movedFrom && q && (
            <p>
              Switched here from {categoryLabel(movedFrom)} for this search.{" "}
              <Link href={`${href(movedFrom, [], q)}&stay=1`} className="font-semibold text-brand">
                Search {categoryLabel(movedFrom)} instead
              </Link>
            </p>
          )}
          {search.suggestion && (
            <p>
              Did you mean{" "}
              <Link href={href(category, diet, search.suggestion)} className="font-semibold text-brand">
                {search.suggestion}
              </Link>
              ?
            </p>
          )}
          {!category && search.hintedCategory && listings.length > 3 && (
            <p>
              Only show{" "}
              <Link href={href(search.hintedCategory)} className="font-semibold text-brand">
                {categoryLabel(search.hintedCategory)}
              </Link>
            </p>
          )}
        </div>
      )}

      {!showingListings ? null : listings.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} saved={l.vendorId === viewer?.vendor?.id ? undefined : savedIds.has(l.id)} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-stone-600">
          <p>{q || diet.length ? `Nothing matches ${where} yet.` : `No listings ${where} yet.`}</p>
          {nearMode && (
            <p className="mt-2 text-sm">
              {radius < 100 && (
                <>
                  <Link href={`/?${new URLSearchParams({ radius: String(RADII.find((r) => r > radius)), ...(category ? { category } : {}), ...(q ? { q } : {}) })}`} className="font-semibold text-brand">
                    Search within {RADII.find((r) => r > radius)} miles
                  </Link>
                  {" · "}
                </>
              )}
              <Link href={href(category, diet, q, metro)} className="font-semibold text-brand">
                Browse all of {metroName(metro)}
              </Link>
              {placeMetro && placeMetro.miles > 60 && <> ({Math.round(placeMetro.miles)} mi away, our nearest city)</>}
            </p>
          )}
          {search.otherMetros.length > 0 && (
            <p className="mt-2 text-sm">
              Found in other cities:{" "}
              {search.otherMetros.map((m, i) => (
                <span key={m.metro}>
                  {i > 0 && ", "}
                  <Link href={href(category, diet, q, m.metro)} className="font-semibold text-brand">
                    {metroName(m.metro)} ({m.count})
                  </Link>
                </span>
              ))}
            </p>
          )}
          {category && q && (
            <p className="mt-2 text-sm">
              <Link href={href(undefined, [], q)} className="font-semibold text-brand">Search all categories</Link>
            </p>
          )}
          <Link href="/vendor/signup" className="mt-3 inline-block font-semibold text-brand">
            Run a home business {nearMode ? `near ${place!.city}` : `in ${metroName(metro)}`}? List it free →
          </Link>
        </div>
      )}

      {showingListings && category !== "ROOM_RENTAL" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-soft px-5 py-4 ring-1 ring-orange-100">
          <div>
            <p className="font-semibold">Can&apos;t find the right person?</p>
            <p className="text-sm text-stone-600">Post what you need once. Sellers near you who offer it will send you quotes.</p>
          </div>
          <Link href={`/requests/new${category ? `?category=${category}` : ""}`} className="btn">Post what you need</Link>
        </div>
      )}
    </div>
  );
}
