import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { LocationPicker } from "@/components/LocationPicker";
import { syncExpirations } from "@/lib/billing";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { browseListings } from "@/lib/listings";
import { DEFAULT_METRO, isMetro, metroName } from "@/lib/metros";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ metro?: string; category?: string; q?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const metro = isMetro(params.metro) ? params.metro : DEFAULT_METRO;
  const category = CATEGORIES.some((c) => c.id === params.category) ? params.category : undefined;
  const q = (params.q ?? "").slice(0, 100);

  await syncExpirations();
  const listings = await browseListings(metro, category, q);

  const href = (cat?: string) => {
    const p = new URLSearchParams({ metro });
    if (cat) p.set("category", cat);
    if (q) p.set("q", q);
    return `/?${p}`;
  };

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

      {(q || category) && (
        <p className="text-sm text-stone-600">
          {listings.length} result{listings.length === 1 ? "" : "s"}
          {q && <> for &ldquo;{q}&rdquo;</>}
          {category && <> in {categoryLabel(category)}</>}
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
          <p>{q ? "Nothing matches your search yet." : "No listings here yet."}</p>
          <Link href="/vendor/signup" className="mt-3 inline-block font-semibold text-brand">
            Run a home business in {metroName(metro)}? List it free →
          </Link>
        </div>
      )}
    </div>
  );
}
