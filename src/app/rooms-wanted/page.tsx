import Link from "next/link";
import { LocationPicker } from "@/components/LocationPicker";
import { RentalTabs } from "@/components/RentalTabs";
import { WantedCard } from "@/components/WantedCard";
import { metroFor } from "@/lib/geo";
import { DEFAULT_METRO, isMetro, metroName } from "@/lib/metros";
import { getUserLocation } from "@/lib/user-location";
import { SPACE_TYPES } from "@/lib/rentals";
import { browseWanted, firstName, wantedNeeds, wantedSpaceLabels } from "@/lib/rooms-wanted";

export const metadata = {
  title: "People looking for a room – BharathMela",
  description: "Renters from the Indian community looking for rooms, paying-guest stays and apartments in your city.",
};

export default async function RoomsWantedPage({
  searchParams,
}: {
  searchParams: Promise<{ metro?: string; rent?: string; space?: string; by?: string; q?: string }>;
}) {
  const p = await searchParams;
  // Default to the city of the visitor's saved location.
  const place = await getUserLocation();
  const metro = isMetro(p.metro) ? p.metro : place ? metroFor(place).metro : DEFAULT_METRO;
  const rent = Number(p.rent) > 0 ? Math.round(Number(p.rent) * 100) : undefined;
  const space = SPACE_TYPES.some((t) => t.id === p.space) ? p.space : undefined;
  const by = /^\d{4}-\d{2}-\d{2}$/.test(p.by ?? "") ? p.by : undefined;
  const q = (p.q ?? "").slice(0, 100);
  const posts = await browseWanted({ metro, minBudget: rent, space, moveInBy: by, query: q });

  return (
    <div className="space-y-6">
      <RentalTabs metro={metro} active="wanted" />
      <section className="rounded-xl bg-gradient-to-br from-sky-50 to-white p-6 ring-1 ring-sky-100 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">People looking for a place in {metroName(metro)}</h1>
        <p className="mt-1 text-stone-600">Have a room or apartment? Message renters directly. Looking yourself? Post what you need.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/rooms-wanted/new?metro=${metro}`} className="btn">I need a place to live</Link>
          <Link href="/rooms-wanted/mine" className="text-sm font-semibold text-brand">My requests</Link>
          <LocationPicker metro={metro} basePath="/rooms-wanted" place={place} />
        </div>
      </section>

      <form className="card grid gap-3 py-4 text-sm sm:grid-cols-5" aria-label="Filters">
        <input type="hidden" name="metro" value={metro} />
        <div className="sm:col-span-2">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} className="input" placeholder="e.g. Sunnyvale, student, vegetarian" />
        </div>
        <div>
          <label className="label" htmlFor="rent">My rent / month</label>
          <input id="rent" name="rent" inputMode="numeric" className="input" placeholder="1200" defaultValue={rent ? rent / 100 : ""} />
        </div>
        <div>
          <label className="label" htmlFor="space">My space</label>
          <select id="space" name="space" defaultValue={space ?? ""} className="input">
            <option value="">Any</option>
            {SPACE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="by">Available by</label>
          <input id="by" name="by" type="date" className="input" defaultValue={by ?? ""} />
        </div>
        <div className="flex gap-2 sm:col-span-5">
          <button className="btn">Find renters</button>
          <Link href={`/rooms-wanted?metro=${metro}`} className="btn-outline">Reset</Link>
          <span className="self-center text-xs text-stone-500">&ldquo;My rent&rdquo; shows renters whose budget covers it.</span>
        </div>
      </form>

      <p className="text-sm text-stone-600">{posts.length} {posts.length === 1 ? "person" : "people"} looking</p>
      {posts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <WantedCard
              key={post.id}
              post={{
                ...post,
                spaceLabels: wantedSpaceLabels(post.spaceTypes),
                needs: wantedNeeds(post),
                firstName: firstName(post.user.name),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center text-stone-600">
          <p>No one matches yet.</p>
          <Link href={`/rooms-wanted/new?metro=${metro}`} className="mt-3 inline-block font-semibold text-brand">Looking for a place? Post a request →</Link>
        </div>
      )}
    </div>
  );
}
