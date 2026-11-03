import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { ListingCard } from "@/components/ListingCard";
import { LocationPicker } from "@/components/LocationPicker";
import { RentalTabs } from "@/components/RentalTabs";
import { syncExpirations } from "@/lib/billing";
import { CATEGORIES, DIET_TAGS, type DietTag, categoryLabel, isDietTag, tagLabel } from "@/lib/constants";
import { upcomingEvents } from "@/lib/event-data";
import { browseListings } from "@/lib/listings";
import { DEFAULT_METRO, isMetro, metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { type RentalFilters, SPACE_TYPES } from "@/lib/rentals";

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
  }>;
}) {
  const params = await searchParams;
  const metro = isMetro(params.metro) ? params.metro : DEFAULT_METRO;
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
  const [{ listings, search }, events] = await Promise.all([
    browseListings(metro, category, q, diet, rentalFilters),
    q || category ? Promise.resolve([]) : upcomingEvents({ metro, take: 4 }),
  ]);

  const href = (cat?: string, dietTags: string[] = [], query = q, city = metro) => {
    const p = new URLSearchParams({ metro: city });
    if (cat) p.set("category", cat);
    if (query) p.set("q", query);
    if (cat === "FOOD" && dietTags.length) p.set("diet", dietTags.join(","));
    return `/?${p}`;
  };
  const toggleDiet = (id: DietTag) => href("FOOD", diet.includes(id) ? diet.filter((d) => d !== id) : [...diet, id]);

  return (
    <div className="space-y-6">
      {params.deleted && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Your account has been deleted.</p>
      )}
      <section className="rounded-xl bg-gradient-to-br from-brand-soft to-white p-6 ring-1 ring-orange-100 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Home businesses from our community, near you</h1>
        <p className="mt-1 text-stone-600">
          Home food, tutors, dance and music teachers, pujaris, artists and more in {metroName(metro)}.
        </p>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" role="search">
          <input type="hidden" name="metro" value={metro} />
          {category && <input type="hidden" name="category" value={category} />}
          {diet.length > 0 && <input type="hidden" name="diet" value={diet.join(",")} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            className="input flex-1"
            placeholder="Try “biryani”, “pooja for housewarming”, “vegan snacks under $20”"
            aria-label="Search listings"
          />
          <button className="btn">Search</button>
        </form>
        {!q && (
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
            Popular:
            {POPULAR.map((term) => (
              <Link key={term} href={href(undefined, [], term)} className="rounded-full bg-white px-2.5 py-0.5 text-stone-700 ring-1 ring-stone-200 hover:text-brand">
                {term}
              </Link>
            ))}
          </p>
        )}
        <div className="mt-3">
          <LocationPicker metro={metro} />
        </div>
      </section>

      {events.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href={`/events?metro=${metro}`} className="text-sm font-semibold text-brand">See all events →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Categories">
        <Link href={href()} className={`badge px-3 py-1.5 ${!category ? "bg-brand text-white" : "bg-white ring-1 ring-stone-200"}`}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={href(c.id)}
            className={`badge px-3 py-1.5 ${category === c.id ? "bg-brand text-white" : "bg-white ring-1 ring-stone-200"}`}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {category === "FOOD" && (
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Dietary filters">
          <span className="text-stone-500">Dietary:</span>
          {DIET_TAGS.map((t) => {
            const on = diet.includes(t.id);
            return (
              <Link
                key={t.id}
                href={toggleDiet(t.id)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1 ring-1 ${on ? "bg-green-50 text-green-800 ring-green-600" : "bg-white text-stone-700 ring-stone-200"}`}
              >
                {on ? "✓ " : ""}
                {t.label}
              </Link>
            );
          })}
        </nav>
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
        <form className="card grid gap-3 py-4 text-sm sm:grid-cols-4" aria-label="Rental filters">
          <input type="hidden" name="metro" value={metro} />
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
      )}

      {(q || category) && (
        <div className="space-y-1 text-sm text-stone-600">
          <p>
            {listings.length} result{listings.length === 1 ? "" : "s"}
            {q && <> for &ldquo;{q}&rdquo;</>}
            {category && <> in {categoryLabel(category)}</>}
            {diet.length > 0 && <> · {diet.map(tagLabel).join(", ")}</>}
            {search.maxPriceCents != null && <> · up to {formatUSD(search.maxPriceCents)}</>}
            {search.minPriceCents != null && <> · from {formatUSD(search.minPriceCents)}</>}
            {" · "}
            <Link href={`/?metro=${metro}`} className="text-brand">Clear</Link>
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

      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-stone-600">
          <p>{q || diet.length ? `Nothing matches in ${metroName(metro)} yet.` : "No listings here yet."}</p>
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
            Run a home business in {metroName(metro)}? List it free →
          </Link>
        </div>
      )}
    </div>
  );
}
