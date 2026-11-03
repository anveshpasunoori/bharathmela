import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { FilterPanel } from "@/components/FilterPanel";
import { ListingCard } from "@/components/ListingCard";
import { RentalTabs } from "@/components/RentalTabs";
import { SortSelect } from "@/components/SortSelect";
import { syncExpirations } from "@/lib/billing";
import { CATEGORIES, DIET_TAGS, type DietTag, categoryLabel, isDietTag, tagLabel } from "@/lib/constants";
import { upcomingEvents } from "@/lib/event-data";
import { metroFor } from "@/lib/geo";
import { SORTS, type SortId, browseListings, categoryCounts } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { EVENT_SERVICES, type EventServiceFilters, OCCASIONS, RENTAL_ITEMS } from "@/lib/event-services";
import { LANGUAGES, type ProfessionalFilters, SPECIALTIES, isProfessional } from "@/lib/professionals";
import { type RentalFilters, SPACE_TYPES } from "@/lib/rentals";
import { resolveLocation } from "@/lib/user-location";
import { FarNote } from "@/components/FarNote";

const RADII = [5, 10, 25, 50, 100];
const POPULAR = ["Biryani", "Tiffin", "Bharatanatyam", "Pooja", "Math tutor", "Mehndi", "Room for rent"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    metro?: string;
    category?: string;
    q?: string;
    diet?: string;
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
  }>;
}) {
  const params = await searchParams;
  // With a saved location and no city picked, browse "near you" by radius across metros.
  const { place, metro, far } = await resolveLocation(params.metro);
  const nearMode = !!place && !isMetro(params.metro);
  const radius = RADII.includes(Number(params.radius)) ? Number(params.radius) : 25;
  const placeMetro = place ? metroFor(place) : null;
  const category = CATEGORIES.some((c) => c.id === params.category) ? params.category : undefined;
  const q = (params.q ?? "").slice(0, 100);
  // Dietary filters only apply to food.
  const diet = category === "FOOD" ? (params.diet ?? "").split(",").filter(isDietTag) : [];
  // Rental filters only apply to room rentals.
  const rentalFilters: RentalFilters =
    category === "ROOM_RENTAL"
      ? {
          space: SPACE_TYPES.some((t) => t.id === params.space) ? params.space : undefined,
          maxRent: Number(params.maxRent) > 0 ? Math.round(Number(params.maxRent) * 100) : undefined,
          availableBy: /^\d{4}-\d{2}-\d{2}$/.test(params.by ?? "") ? params.by : undefined,
          privateBath: params.pbath === "1",
          furnished: params.furn === "1",
          pets: params.pets === "1",
        }
      : {};

  await syncExpirations();
  // Specialty, language and free-consultation filters for realtors and lawyers.
  const proFilters: ProfessionalFilters =
    category && isProfessional(category)
      ? {
          specialty: SPECIALTIES[category].some((s) => s.id === params.spec) ? params.spec : undefined,
          language: (LANGUAGES as readonly string[]).includes(params.lang ?? "") ? params.lang : undefined,
          freeConsult: params.free === "1",
        }
      : {};
  // Service, rental item, occasion and insurance filters for wedding and event vendors.
  const eventFilters: EventServiceFilters =
    category === "EVENT_SERVICES"
      ? {
          service: EVENT_SERVICES.some((s) => s.id === params.svc) ? params.svc : undefined,
          item: RENTAL_ITEMS.some((s) => s.id === params.item) ? params.item : undefined,
          occasion: OCCASIONS.some((o) => o.id === params.occ) ? params.occ : undefined,
          insured: params.ins === "1",
        }
      : {};
  const sort: SortId = SORTS.find((x) => x.id === params.sort && (x.id !== "near" || place))?.id ?? "best";
  const near = place ? { lat: place.lat, lng: place.lng, radiusMiles: nearMode ? radius : null } : undefined;
  // The home page shows categories first; listings appear once a category is picked or a search is made.
  const showingListings = !!(category || q);
  const [{ listings, search }, events, counts] = await Promise.all([
    showingListings
      ? browseListings({ metro, category, query: q, diet, rentalFilters, proFilters, eventFilters, near, sort })
      : Promise.resolve({ listings: [], search: { active: false, suggestion: null, otherMetros: [], hintedCategory: undefined, maxPriceCents: undefined, minPriceCents: undefined } }),
    showingListings ? Promise.resolve([]) : upcomingEvents({ metro, take: 4 }),
    showingListings ? Promise.resolve(new Map<string, number>()) : categoryCounts(metro, near),
  ]);
  const where = nearMode ? `within ${radius} mi of ${place!.city}` : `in ${metroName(metro)}`;

  // Links keep the current location mode: "near you" (radius) or a picked metro.
  const locationParams = (city?: string) => {
    const p = new URLSearchParams();
    if (city) p.set("metro", city);
    else if (nearMode) p.set("radius", String(radius));
    else p.set("metro", metro);
    return p;
  };
  const home = `/?${locationParams()}`;
  const href = (cat?: string, dietTags: string[] = [], query = q, city?: string) => {
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
  const toggleDiet = (id: DietTag) => href("FOOD", diet.includes(id) ? diet.filter((d) => d !== id) : [...diet, id]);

  return (
    <div className="space-y-6">
      {params.deleted && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Your account has been deleted.</p>
      )}
      <section className={showingListings ? "space-y-3" : "space-y-3 rounded-xl bg-gradient-to-br from-brand-soft to-white p-5 ring-1 ring-orange-100 sm:p-8"}>
        {showingListings ? (
          <div>
            <Link href={home} className="text-sm text-stone-500 hover:text-brand">← All categories</Link>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              {categoryInfo ? `${categoryInfo.icon} ${categoryInfo.label}` : <>Results for &ldquo;{q}&rdquo;</>}
            </h1>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Home businesses from our community, near you</h1>
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
        {place && (
          // Distance from the visitor's location (set in the top bar).
          <nav className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 text-sm" aria-label="Distance">
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
                  <span className="text-2xl sm:text-3xl" aria-hidden>{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight sm:text-base">{c.label}</span>
                    <span className="text-xs text-stone-500">{n ? `${n} listing${n === 1 ? "" : "s"}` : "Be the first"}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-stone-600">
            Need a room? <Link href={`/rooms-wanted/new?metro=${metro}`} className="font-semibold text-brand">Post what you&apos;re looking for</Link>
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
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm" aria-label="Categories">
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

      {category === "FOOD" && (
        <nav className="-mx-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 pb-1 text-sm" aria-label="Dietary filters">
          <span className="shrink-0 text-stone-500">Dietary:</span>
          {DIET_TAGS.map((t) => {
            const on = diet.includes(t.id);
            return (
              <Link
                key={t.id}
                href={toggleDiet(t.id)}
                aria-pressed={on}
                className={`shrink-0 rounded-full px-3 py-1 ring-1 ${on ? "bg-green-50 text-green-800 ring-green-600" : "bg-white text-stone-700 ring-stone-200"}`}
              >
                {on ? "✓ " : ""}
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}

      {category === "EVENT_SERVICES" && (
        <FilterPanel active={Object.values(eventFilters).filter(Boolean).length}>
        <form className="grid gap-3 text-sm sm:grid-cols-4" aria-label="Event service filters">
          {locationInputs}
          <input type="hidden" name="category" value="EVENT_SERVICES" />
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <label className="label" htmlFor="svc">Service</label>
            <select id="svc" name="svc" defaultValue={eventFilters.service ?? ""} className="input">
              <option value="">Any</option>
              {EVENT_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="item">Rental item</label>
            <select id="item" name="item" defaultValue={eventFilters.item ?? ""} className="input">
              <option value="">Any</option>
              {RENTAL_ITEMS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="occ">Occasion</label>
            <select id="occ" name="occ" defaultValue={eventFilters.occasion ?? ""} className="input">
              <option value="">Any</option>
              {OCCASIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="ins" value="1" defaultChecked={eventFilters.insured} /> Insured</label>
            <button className="btn">Apply</button>
          </div>
        </form>
        </FilterPanel>
      )}

      {category && isProfessional(category) && (
        <FilterPanel active={Object.values(proFilters).filter(Boolean).length}>
        <form className="grid gap-3 text-sm sm:grid-cols-4" aria-label="Professional filters">
          {locationInputs}
          <input type="hidden" name="category" value={category} />
          {q && <input type="hidden" name="q" value={q} />}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="spec">{category === "LEGAL" ? "Practice area" : "Service"}</label>
            <select id="spec" name="spec" defaultValue={proFilters.specialty ?? ""} className="input">
              <option value="">Any</option>
              {SPECIALTIES[category].map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lang">Speaks</label>
            <select id="lang" name="lang" defaultValue={proFilters.language ?? ""} className="input">
              <option value="">Any language</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="free" value="1" defaultChecked={proFilters.freeConsult} /> Free consultation</label>
            <button className="btn">Apply</button>
          </div>
          <p className="text-xs text-stone-500 sm:col-span-4">
            Always check a {category === "LEGAL" ? "lawyer's license with the state bar" : "realtor's license with your state's real estate department"} before hiring.
          </p>
        </form>
        </FilterPanel>
      )}

      {category === "ROOM_RENTAL" && (
        <div className="space-y-3">
          <RentalTabs metro={metro} active="offered" />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
            <span>Looking for a room? Post what you need and let owners come to you.</span>
            <Link href={`/rooms-wanted/new?metro=${metro}`} className="btn py-1.5">I need a place to live</Link>
          </div>
        </div>
      )}

      {category === "ROOM_RENTAL" && (
        <FilterPanel active={Object.values(rentalFilters).filter((v) => v != null && v !== false).length}>
        <form className="grid gap-3 text-sm sm:grid-cols-4" aria-label="Rental filters">
          {locationInputs}
          <input type="hidden" name="category" value="ROOM_RENTAL" />
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <label className="label" htmlFor="space">Space</label>
            <select id="space" name="space" defaultValue={rentalFilters.space ?? ""} className="input">
              <option value="">Any</option>
              {SPACE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maxRent">Max rent / month</label>
            <input id="maxRent" name="maxRent" inputMode="numeric" placeholder="e.g. 1500" className="input"
              defaultValue={rentalFilters.maxRent ? rentalFilters.maxRent / 100 : ""} />
          </div>
          <div>
            <label className="label" htmlFor="by">Move in by</label>
            <input id="by" name="by" type="date" className="input" defaultValue={rentalFilters.availableBy ?? ""} />
          </div>
          <div className="flex flex-col justify-end gap-1">
            <label className="flex items-center gap-2"><input type="checkbox" name="pbath" value="1" defaultChecked={rentalFilters.privateBath} /> Private bath</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="furn" value="1" defaultChecked={rentalFilters.furnished} /> Furnished</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="pets" value="1" defaultChecked={rentalFilters.pets} /> Pets allowed</label>
          </div>
          <div className="flex gap-2 sm:col-span-4">
            <button className="btn">Apply filters</button>
            <Link href={`/?metro=${metro}&category=ROOM_RENTAL`} className="btn-outline">Reset</Link>
          </div>
        </form>
        </FilterPanel>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
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
    </div>
  );
}
