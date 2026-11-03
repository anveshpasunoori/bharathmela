import Link from "next/link";
import { FilterBar, type FilterDef } from "@/components/FilterBar";
import { RentalTabs } from "@/components/RentalTabs";
import { WantedCard } from "@/components/WantedCard";
import { metroName } from "@/lib/metros";
import { resolveLocation } from "@/lib/user-location";
import { FarNote } from "@/components/FarNote";
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
  const { metro, far } = await resolveLocation(p.metro);
  const rent = Number(p.rent) > 0 ? Math.round(Number(p.rent) * 100) : undefined;
  const space = SPACE_TYPES.some((t) => t.id === p.space) ? p.space : undefined;
  const by = /^\d{4}-\d{2}-\d{2}$/.test(p.by ?? "") ? p.by : undefined;
  const q = (p.q ?? "").slice(0, 100);
  const posts = await browseWanted({ metro, minBudget: rent, space, moveInBy: by, query: q });

  // The same filter bar as listing results, worded for someone with a room to offer.
  const filters: FilterDef[] = [
    {
      kind: "max", key: "rent", param: "rent", label: "My rent", prefix: "Rent", fieldLabel: "My rent", suffix: "per month",
      hint: "Shows renters whose budget covers it.", value: rent ? rent / 100 : null, presets: [800, 1000, 1200, 1500, 2000, 2500],
    },
    {
      kind: "choice", key: "space", label: "My space",
      options: [{ label: "Any space", params: { space: null } }, ...SPACE_TYPES.map((t) => ({ label: t.label, params: { space: t.id } }))],
      selected: space ? SPACE_TYPES.findIndex((t) => t.id === space) + 1 : null,
    },
    { kind: "date", key: "by", param: "by", label: "Available by", prefix: "Available", value: by ?? null },
  ];

  return (
    <div className="space-y-4">
      <RentalTabs metro={metro} active="wanted" />
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">People looking for a place</h1>
          <Link href="/rooms-wanted/mine" className="text-sm font-semibold text-brand">My requests</Link>
        </div>
        <p className="text-sm text-stone-600">Have a room? Message renters directly. Looking yourself? Post what you need and let owners come to you.</p>
        <Link href={`/rooms-wanted/new?metro=${metro}`} className="btn">I need a place to live</Link>
      </section>

      <div className="space-y-3">
        <form className="flex gap-2" role="search">
          <input type="hidden" name="metro" value={metro} />
          {rent && <input type="hidden" name="rent" value={rent / 100} />}
          {space && <input type="hidden" name="space" value={space} />}
          {by && <input type="hidden" name="by" value={by} />}
          <input name="q" type="search" defaultValue={q} maxLength={100} className="input flex-1" placeholder="Search by area, job or school, e.g. “Sunnyvale”, “student”" aria-label="Search renters" />
          <button className="btn">Search</button>
        </form>
        <FilterBar filters={filters} clearHref={`/rooms-wanted?${new URLSearchParams({ metro, ...(q ? { q } : {}) })}`} />
      </div>

      <FarNote far={far} metro={metro} />
      <p className="text-sm text-stone-600">{posts.length} {posts.length === 1 ? "person" : "people"} looking in {metroName(metro)}</p>
      {posts.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
