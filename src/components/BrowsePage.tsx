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
import { SORTS, type SortId, browseListings, categoryCounts, categoryForSearch, publicListing, savedListingIds } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { formatUSD, priceLabel } from "@/lib/plans";
import { OCCASIONS, RENTAL_ITEMS } from "@/lib/event-services";
import { LANGUAGES, isProfessional } from "@/lib/professionals";
import { RADII, parseFilters, searchQueryString } from "@/lib/browse-params";
import { db } from "@/lib/db";
import { sameLocation } from "@/lib/saved-searches";
import { cityCategoryPath, cityPath, listingPath } from "@/lib/seo";
import { citySubcategoryPath, listingSubcategories, pickedSubcategory, subcategoriesFor, subcategoryLabel } from "@/lib/subcategories";
import { pageFaq } from "@/lib/page-faq";
import { breadcrumbs, faqSchema, itemListSchema } from "@/lib/structured-data";
import { JsonLd } from "@/components/JsonLd";
import { ListingsMap, type MapPoint } from "@/components/ListingsMap";
import { zipCoords } from "@/lib/geo";
import { resolveLocation } from "@/lib/user-location";
import { FarNote } from "@/components/FarNote";
import { NearMePrompt } from "@/components/NearMePrompt";
import { ShowAllCategories } from "@/components/ShowAllCategories";
import { HeroArt, TrustStrip } from "@/components/HomeHero";
import { categoryName, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { ListingRow } from "@/components/ListingRow";

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
  view?: string;
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
  // Map view: each listing at its ZIP code's center, nudged a little by its id so pins in one ZIP don't
  // stack and no seller's address is shown.
  const mapView = showingListings && params.view === "map";
  const mapPoints: MapPoint[] = mapView
    ? listings.flatMap((l) => {
        const c = zipCoords(l.zip);
        if (!c) return [];
        const h = [...l.id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
        const price = l.priceCents != null ? priceLabel(l.priceCents, l.priceUnit).main : null;
        return [{ id: l.id, href: listingPath(l), title: l.title, price, lat: c.lat + ((h % 200) - 100) / 12000, lng: c.lng + (((h >> 8) % 200) - 100) / 12000 }];
      })
    : [];
  const viewHref = (view: "list" | "map") => {
    const p = new URLSearchParams(pageQuery);
    for (const k of ["ss", "from", "stay", "deleted", "view"]) p.delete(k);
    if (view === "map") p.set("view", "map");
    return `?${p}`;
  };

  // The home page also shows what's new and what buyers rate highest here.
  const [newest, topRated] = showingListings
    ? [[], []]
    : await Promise.all([
        browseListings({ metro, near, sort: "new" }).then((r) => r.listings.slice(0, 8)),
        browseListings({ metro, near, sort: "rating" }).then((r) => r.listings.filter((l) => l.rating && l.rating.count > 0).slice(0, 8)),
      ]);
  // Hearts on the cards: which results the visitor saved; none on a seller's own listings.
  const viewer = await getCurrentUser();
  const savedIds = await savedListingIds(viewer?.id, [...listings, ...newest, ...topRated].map((l) => l.id));
  // "Save search": whether this search, at this location, is already saved. Opening a saved search
  // (marked with `ss`) resets its count of new listings.
  const searchQuery = searchQueryString(params);
  const here = { metro, nearLat: nearMode ? place!.lat : null, nearLng: nearMode ? place!.lng : null, radiusMiles: nearMode ? radius : null };
  const mySearches = viewer && showingListings ? await db.savedSearch.findMany({ where: { userId: viewer.id } }) : [];
  const searchSaved = mySearches.some((s) => s.params === searchQuery && sameLocation(s, here));
  if (viewer && params.ss) await db.savedSearch.updateMany({ where: { id: params.ss, userId: viewer.id }, data: { viewedAt: new Date() } });
  const pageQuery = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  // Busiest categories first; the rest keep their usual order.
  const tileOrder = [...CATEGORIES].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  const totalListings = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const where = nearMode ? `within ${radius} mi of ${place!.city}` : `in ${metroName(metro)}`;
  // The same, in the visitor's language, for headings and buttons.
  const lang = await getLang();
  const whereT = nearMode ? t(lang, "withinOf", { r: radius, place: place!.city }) : t(lang, "inCity", { city: metroName(metro) });
  const catName = (c: { id: string; label: string }) => categoryName(lang, c.id, c.label);

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
  // City-category and subcategory pages (no search): questions answered from the listings, links to the
  // same category in other cities, and structured data. City pages link their busiest subcategories.
  const seoPage = !!category && !q;
  const [otherCities, popularSubs] = await Promise.all([
    seoPage
      ? db.listing.groupBy({ by: ["metro"], where: { ...publicListing(), category }, _count: true }).then((rows) =>
          rows.filter((r) => r.metro !== metro && isMetro(r.metro)).sort((a, b) => b._count - a._count).map((r) => r.metro),
        )
      : Promise.resolve([]),
    !showingListings && !nearMode
      ? db.listing.findMany({ where: { ...publicListing(), metro }, select: { category: true, tags: true, details: true }, take: 5000 }).then((rows) => {
          const counts = new Map<string, { category: string; id: string; n: number }>();
          for (const r of rows) for (const id of listingSubcategories(r)) {
            const k = `${r.category}/${id}`;
            counts.set(k, { category: r.category, id, n: (counts.get(k)?.n ?? 0) + 1 });
          }
          return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 24);
        })
      : Promise.resolve([]),
  ]);
  // Subcategory chips (Auto Services → Oil change, Towing…). Picking one keeps the other filters; plain
  // browsing in a city uses its clean page (/in/jacksonville/auto-services/oil-change).
  const subs = subcategoriesFor(category);
  const picked = pickedSubcategory(category, params);
  const subHref = (id?: string, drop: string[] = []) => {
    const p = new URLSearchParams(pageQuery);
    for (const k of ["ss", "from", "stay", "deleted", ...drop]) p.delete(k);
    if (subs) p.delete(subs.param);
    const plain = [...p.keys()].every((k) => k === "category" || k === "metro");
    if (!nearMode && plain) return id ? citySubcategoryPath(metro, category!, id) : cityCategoryPath(metro, category!);
    p.set("category", category!);
    if (!nearMode) p.set("metro", metro);
    if (id && subs) p.set(subs.param, id);
    return `/?${p}`;
  };

  const pageWhat = picked?.label ?? categoryInfo?.label ?? "";
  const pageCity = nearMode ? place!.city : metroName(metro).split(",")[0];
  const faq = seoPage
    ? pageFaq({ what: pageWhat, city: pageCity, listings, tip: LICENSE_TIPS[category!], buying: category === "GARAGE_SALE" })
    : [];
  const pageSchema = seoPage
    ? [
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: metroName(metro), path: cityPath(metro) },
          { name: categoryInfo!.label, path: cityCategoryPath(metro, category!) },
          ...(picked ? [{ name: picked.label, path: citySubcategoryPath(metro, category!, picked.id) }] : []),
        ]),
        ...(listings.length ? [itemListSchema(`${pageWhat} in ${metroName(metro)}`, listings)] : []),
        faqSchema(faq),
      ]
    : [];

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
  if (category === "FOOD") {
    filterBar.push({ kind: "multi", key: "diet", param: "diet", label: "Dietary", options: DIET_TAGS, selected: diet });
  }
  if (category === "ROOM_RENTAL") {
    filterBar.push(
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
      pick("lang", "Language", "Any language", "lang", LANGUAGES.map((l) => ({ id: l, label: `Speaks ${l}` })), proFilters.language),
      { kind: "toggle", key: "free", param: "free", label: "Free consultation", on: !!proFilters.freeConsult },
    );
  }
  if (category === "EVENT_SERVICES") {
    filterBar.push(
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
      <section
        className={
          showingListings ? "space-y-3" : "relative isolate space-y-3 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 via-brand-soft to-white p-5 ring-1 ring-orange-100 sm:p-8"
        }
      >
        {!showingListings && <HeroArt />}
        {showingListings ? (
          <div>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
              <Link href={home} className="hover:text-brand">{t(lang, "allCategories")}</Link>
              {categoryInfo && (
                <>
                  <span aria-hidden>›</span>
                  {picked ? <Link href={subHref()} className="hover:text-brand">{catName(categoryInfo)}</Link> : <span className="text-stone-700">{catName(categoryInfo)}</span>}
                </>
              )}
              {picked && (
                <>
                  <span aria-hidden>›</span>
                  <span className="text-stone-700">{picked.label}</span>
                </>
              )}
            </nav>
            <h1 className="mt-1 flex items-center gap-3 text-xl font-bold sm:text-2xl">
              {categoryInfo ? (
                <>
                  <CategoryIcon id={categoryInfo.id} sub={picked?.id} size={44} className="h-10 w-10 sm:h-11 sm:w-11" />
                  <span>
                    {picked?.label ?? catName(categoryInfo)}{" "}
                    <span className="font-semibold text-stone-500">{nearMode ? t(lang, "nearPlace", { place: place!.city }) : t(lang, "inCity", { city: metroName(metro) })}</span>
                  </span>
                </>
              ) : (
                <>Results for &ldquo;{q}&rdquo;</>
              )}
            </h1>
          </div>
        ) : (
          <div>
            <h1 className="relative text-2xl font-bold sm:text-4xl sm:tracking-tight">
              {isMetro(params.metro) ? t(lang, "localBusinessesIn", { city: metroName(metro) }) : t(lang, "localBusinessesNear")}
            </h1>
          </div>
        )}
        {category === "ROOM_RENTAL" && <RentalTabs metro={metro} active="offered" />}
        <form className="flex gap-2" role="search">
          {locationInputs}
          {category && <input type="hidden" name="category" value={category} />}
          {picked && subs && <input type="hidden" name={subs.param} value={picked.id} />}
          {diet.length > 0 && <input type="hidden" name="diet" value={diet.join(",")} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            className="input flex-1"
            placeholder={categoryInfo ? (lang === "en" ? `Search ${categoryInfo.label.toLowerCase()}…` : `${t(lang, "search")}: ${catName(categoryInfo)}…`) : t(lang, "searchPlaceholder")}
            aria-label="Search listings"
          />
          <button className="btn">{t(lang, "search")}</button>
        </form>
        {subs && (
          <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm" aria-label={`Kinds of ${categoryInfo!.label.toLowerCase()}`}>
            {/* The picked one right after "All", so it's visible without scrolling the row. */}
            {[{ id: undefined, label: t(lang, "all") }, ...(picked ? [picked] : []), ...subs.options.filter((o) => o.id !== picked?.id)].map((o) => {
              const on = (picked?.id ?? undefined) === o.id;
              return (
                <Link
                  key={o.id ?? "all"}
                  href={subHref(o.id)}
                  aria-current={on ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-1 pr-3 ring-1 ${on ? "bg-stone-900 text-stone-50 ring-stone-900" : "bg-white text-stone-700 ring-stone-200 hover:ring-brand/40 hover:text-brand"}`}
                >
                  <CategoryIcon id={category!} sub={o.id} size={24} className="h-6 w-6" />
                  {o.label}
                </Link>
              );
            })}
          </nav>
        )}
        {showingListings && !category && (
          // One scrollable row on phones instead of a wall of wrapped chips.
          <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm" aria-label="Narrow to a category">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={href(c.id)} className="badge shrink-0 whitespace-nowrap bg-white px-3 py-1.5 ring-1 ring-stone-200 hover:text-brand">
                {c.icon} {catName(c)}
              </Link>
            ))}
          </nav>
        )}
        {showingListings && <FilterBar filters={filterBar} clearHref={href(category, [], q)} />}
        {place && !showingListings && (
          // Distance from the visitor's location (set in the top bar).
          <nav className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 text-sm" aria-label="Distance">
            <span className="shrink-0 text-stone-500">{t(lang, "within")}</span>
            {RADII.map((r) => {
              const p = new URLSearchParams();
              p.set("radius", String(r));
              if (category) p.set("category", category);
              if (q) p.set("q", q);
              const on = nearMode && radius === r;
              return (
                <Link key={r} href={`/?${p}`} className={`shrink-0 rounded-full px-3 py-1 ring-1 ${on ? "bg-brand text-snow ring-brand" : "bg-white text-stone-700 ring-stone-200"}`}>
                  {r} mi
                </Link>
              );
            })}
            {/* A whole metro only counts as local when it's nearby; a far one stays in the top-bar picker. */}
            {!far && (
              <Link href={href(category, diet, q, metro)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 ring-1 ${!nearMode ? "bg-brand text-snow ring-brand" : "bg-white text-stone-700 ring-stone-200"}`}>
                {t(lang, "allOf", { city: metroName(metro) })}
              </Link>
            )}
          </nav>
        )}
        {!nearMode && <FarNote far={far} metro={metro} />}
        {!place && !showingListings && <NearMePrompt city={metroName(metro)} />}
        {!showingListings && <TrustStrip items={[t(lang, "trustVerified"), t(lang, "trustReviews"), t(lang, "trustFree")]} />}
      </section>

      {!showingListings && (
        <section className="group">
          {totalListings < 5 && (
            <div className="mb-4 rounded-xl bg-sky-50 px-5 py-4 text-sm ring-1 ring-sky-100">
              <p className="font-semibold text-stone-800">BharathMela is just getting started {where}.</p>
              <p className="mt-1 text-stone-600">
                Tell us what you need and sellers here will get your request as they join, or be one of the first businesses listed.
              </p>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-semibold">
                <Link href="/requests/new" className="text-brand">Post what you need →</Link>
                <Link href="/vendor/signup" className="text-brand">List your business free →</Link>
              </p>
            </div>
          )}
          <h2 className="mb-3 text-lg font-semibold">{t(lang, "lookingFor")}</h2>
          {/* Phones show the 8 busiest categories first; "See all" reveals the rest. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tileOrder.map((c, i) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={href(c.id)}
                  className={`card items-center gap-3 p-3 transition hover:shadow-md hover:ring-1 hover:ring-brand/30 sm:flex sm:p-4 ${i < 8 ? "flex" : "hidden group-data-[all=true]:flex"}`}
                >
                  <CategoryIcon id={c.id} size={56} className="h-12 w-12 sm:h-14 sm:w-14" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight sm:text-base">{catName(c)}</span>
                    <span className="text-xs text-stone-500">{n ? (n === 1 ? t(lang, "listingCount") : t(lang, "listingsCount", { n })) : t(lang, "beFirst")}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <ShowAllCategories total={CATEGORIES.length} />
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

      {newest.length > 0 && <ListingRow title={t(lang, "newIn", { where: whereT })} listings={newest} savedIds={savedIds} viewerVendorId={viewer?.vendor?.id} />}
      {topRated.length > 0 && <ListingRow title={t(lang, "topRated")} listings={topRated} savedIds={savedIds} viewerVendorId={viewer?.vendor?.id} />}

      {events.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t(lang, "upcomingEvents")}</h2>
            <Link href={`/events?metro=${metro}`} className="text-sm font-semibold text-brand">{t(lang, "seeAll")}</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {(q || category) && (
        <div className="space-y-1 text-sm text-stone-600">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p>
              <span className="font-semibold text-stone-900">{listings.length === 1 ? t(lang, "result") : t(lang, "results", { n: listings.length })}</span>
              {q && <> for &ldquo;{q}&rdquo;</>}
              {diet.length > 0 && <> · {diet.map(tagLabel).join(", ")}</>}
              {search.maxPriceCents != null && <> · up to {formatUSD(search.maxPriceCents)}</>}
              {search.minPriceCents != null && <> · from {formatUSD(search.minPriceCents)}</>}
              {q && (
                <>
                  {" · "}
                  <Link href={category ? subHref(picked?.id, ["q"]) : home} className="text-brand">Clear search</Link>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
              {listings.length > 0 && (
                <span className="inline-flex shrink-0 overflow-hidden rounded-full text-sm ring-1 ring-stone-300" role="group" aria-label="View">
                  <Link href={viewHref("list")} aria-current={!mapView ? "page" : undefined} className={`px-3 py-1.5 ${!mapView ? "bg-stone-900 text-stone-50" : "bg-white text-stone-700 hover:text-brand"}`}>{t(lang, "list")}</Link>
                  <Link href={viewHref("map")} aria-current={mapView ? "page" : undefined} className={`px-3 py-1.5 ${mapView ? "bg-stone-900 text-stone-50" : "bg-white text-stone-700 hover:text-brand"}`}>{t(lang, "map")}</Link>
                </span>
              )}
              <SaveSearchButton query={pageQuery} saved={searchSaved} />
              {listings.length > 1 && <SortSelect options={SORTS.filter((x) => x.id !== "near" || place)} value={sort} />}
            </div>
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

      {mapView && mapPoints.length > 0 ? (
        <ListingsMap points={mapPoints} />
      ) : !showingListings ? null : listings.length ? (
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

      {showingListings && (
        <div className="space-y-1 text-xs text-stone-500">
          {category && LICENSE_TIPS[category] && <p>Tip: {LICENSE_TIPS[category]}</p>}
          {listings.length > 1 && (
            <p title="Sponsored listings paid to appear first. Pro sellers pay for a higher spot in Recommended.">
              The Recommended order includes paid placement · <Link href="/pricing" className="underline">how it works</Link>
            </p>
          )}
        </div>
      )}

      {category === "ROOM_RENTAL" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 px-5 py-4 ring-1 ring-sky-100">
          <div>
            <p className="font-semibold">Looking for a room?</p>
            <p className="text-sm text-stone-600">Post what you need and let owners come to you.</p>
          </div>
          <Link href={`/rooms-wanted/new?metro=${metro}`} className="btn">I need a place to live</Link>
        </div>
      )}

      {(category === "GARAGE_SALE" || category === "ROOM_RENTAL") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 px-5 py-4 ring-1 ring-sky-100">
          <div>
            <p className="font-semibold">{category === "GARAGE_SALE" ? "Having a garage or moving sale?" : "Renting out a room?"}</p>
            <p className="text-sm text-stone-600">List it free. No business needed: post under your own name.</p>
          </div>
          <Link
            href={viewer?.vendor ? `/vendor/listings/new?category=${category}` : `/vendor/signup?kind=individual&next=${encodeURIComponent(`/vendor/listings/new?category=${category}`)}`}
            className="btn"
          >
            {category === "GARAGE_SALE" ? "List your sale" : "List your room"}
          </Link>
        </div>
      )}

      {showingListings && category !== "ROOM_RENTAL" && category !== "GARAGE_SALE" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-soft px-5 py-4 ring-1 ring-orange-100">
          <div>
            <p className="font-semibold">{t(lang, "cantFind")}</p>
            <p className="text-sm text-stone-600">{t(lang, "cantFindHint")}</p>
          </div>
          <Link href={`/requests/new${category ? `?category=${category}` : ""}`} className="btn">{t(lang, "postWhatYouNeed")}</Link>
        </div>
      )}

      {faq.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">
            {pageWhat} in {pageCity}: common questions
          </h2>
          <div className="divide-y divide-stone-200 rounded-xl bg-white ring-1 ring-stone-200">
            {faq.map((f) => (
              <details key={f.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-medium text-stone-800 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span aria-hidden className="text-stone-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-stone-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {seoPage && otherCities.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">{pageWhat} in other cities</h2>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label={`${pageWhat} in other cities`}>
            {otherCities.map((m) => (
              <Link key={m} href={picked ? citySubcategoryPath(m, category!, picked.id) : cityCategoryPath(m, category!)} className="text-brand hover:underline">
                {metroName(m)}
              </Link>
            ))}
          </nav>
        </section>
      )}

      {popularSubs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">Popular in {metroName(metro)}</h2>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label={`Popular in ${metroName(metro)}`}>
            {popularSubs.map((p) => (
              <Link key={`${p.category}/${p.id}`} href={citySubcategoryPath(metro, p.category, p.id)} className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 ring-1 ring-stone-200 hover:text-brand">
                <CategoryIcon id={p.category} sub={p.id} size={24} className="h-6 w-6" />
                {subcategoryLabel(p.category, p.id)}
              </Link>
            ))}
          </nav>
        </section>
      )}

      {pageSchema.length > 0 && <JsonLd data={pageSchema} />}

      {category && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">{t(lang, "otherCategories", { where: whereT })}</h2>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label="Other categories">
            {CATEGORIES.filter((c) => c.id !== category).map((c) => (
              <Link key={c.id} href={href(c.id)} className="badge whitespace-nowrap bg-white px-3 py-1.5 ring-1 ring-stone-200 hover:text-brand">
                {c.icon} {catName(c)}
              </Link>
            ))}
          </nav>
        </section>
      )}
    </div>
  );
}
