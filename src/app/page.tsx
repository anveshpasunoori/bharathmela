import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { LocationPicker } from "@/components/LocationPicker";
import { syncExpirations } from "@/lib/billing";
import { CATEGORIES, DIET_TAGS, type DietTag, categoryLabel, isDietTag, tagLabel } from "@/lib/constants";
import { browseListings } from "@/lib/listings";
import { DEFAULT_METRO, isMetro, metroName } from "@/lib/metros";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ metro?: string; category?: string; q?: string; diet?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const metro = isMetro(params.metro) ? params.metro : DEFAULT_METRO;
  const category = CATEGORIES.some((c) => c.id === params.category) ? params.category : undefined;
  const q = (params.q ?? "").slice(0, 100);
  // Dietary filters only apply to food.
  const diet = category === "FOOD" ? (params.diet ?? "").split(",").filter(isDietTag) : [];

  await syncExpirations();
  const listings = await browseListings(metro, category, q, diet);

  const href = (cat?: string, dietTags: string[] = []) => {
    const p = new URLSearchParams({ metro });
    if (cat) p.set("category", cat);
    if (q) p.set("q", q);
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
          <input name="q" defaultValue={q} className="input flex-1" placeholder="Search biryani, Bharatanatyam, Telugu tutor…" aria-label="Search listings" />
          <button className="btn">Search</button>
        </form>
        <div className="mt-3">
          <LocationPicker metro={metro} />
        </div>
      </section>

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

      {(q || category) && (
        <p className="text-sm text-stone-600">
          {listings.length} result{listings.length === 1 ? "" : "s"}
          {q && <> for &ldquo;{q}&rdquo;</>}
          {category && <> in {categoryLabel(category)}</>}
          {diet.length > 0 && <> · {diet.map(tagLabel).join(", ")}</>}
          {" · "}
          <Link href={`/?metro=${metro}`} className="text-brand">Clear</Link>
        </p>
      )}

      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-stone-600">
          <p>{q || diet.length ? "Nothing matches your search and filters yet." : "No listings here yet."}</p>
          <Link href="/vendor/signup" className="mt-3 inline-block font-semibold text-brand">
            Run a home business in {metroName(metro)}? List it free →
          </Link>
        </div>
      )}
    </div>
  );
}
