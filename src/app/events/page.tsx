import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { type EventWhen, upcomingEvents } from "@/lib/event-data";
import { EVENT_TYPES, FESTIVALS, eventTypeLabel, isEventType, isFestival } from "@/lib/events";
import { metroName } from "@/lib/metros";
import { resolveLocation } from "@/lib/user-location";
import { FarNote } from "@/components/FarNote";

export const metadata = {
  title: "Indian events near you: festivals, concerts, pujas",
  alternates: { canonical: "/events" },
  description: "Concerts, dance performances, festival celebrations, pujas and community events in your US city.",
};

const WHEN: { id: EventWhen; label: string }[] = [
  { id: "all", label: "All upcoming" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "Next 30 days" },
];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ metro?: string; type?: string; festival?: string; when?: string; free?: string; q?: string }>;
}) {
  const p = await searchParams;
  // Default to the city of the visitor's saved location.
  const { metro, far } = await resolveLocation(p.metro);
  const type = p.type && isEventType(p.type) ? p.type : undefined;
  const festival = p.festival && isFestival(p.festival) ? p.festival : undefined;
  const when = (WHEN.find((w) => w.id === p.when)?.id ?? "all") as EventWhen;
  const freeOnly = p.free === "1";
  const q = (p.q ?? "").slice(0, 100);

  const events = await upcomingEvents({ metro, type, festival, when, freeOnly, query: q });

  const href = (change: Record<string, string | undefined>) => {
    const next = { metro, type, festival, when: when === "all" ? undefined : when, free: freeOnly ? "1" : undefined, q: q || undefined, ...change };
    const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    return `/events?${params}`;
  };
  const chip = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3 py-1 ring-1 ${on ? "bg-brand text-snow ring-brand" : "bg-white text-stone-700 ring-stone-200"}`;
  const filtered = !!(type || festival || q || freeOnly || when !== "all");

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">Events</h1>
          <Link href="/vendor/events/new" className="text-sm font-semibold text-brand">+ Post an event</Link>
        </div>
        <form className="flex gap-2" role="search">
          <input type="hidden" name="metro" value={metro} />
          {type && <input type="hidden" name="type" value={type} />}
          {festival && <input type="hidden" name="festival" value={festival} />}
          <input type="search" name="q" defaultValue={q} maxLength={100} className="input flex-1"
            placeholder="Garba, concert, Diwali mela…" aria-label="Search events" />
          <button className="btn">Search</button>
        </form>
      </section>

      {/* Two swipeable rows instead of a wall of wrapped chips. */}
      <div className="space-y-2 text-sm">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="When">
          {WHEN.map((w) => (
            <Link key={w.id} href={href({ when: w.id === "all" ? undefined : w.id })} className={chip(when === w.id)}>
              {w.id === "all" ? "Any date" : w.label}
            </Link>
          ))}
          <Link href={href({ free: freeOnly ? undefined : "1" })} className={chip(freeOnly)}>
            {freeOnly ? "✓ " : ""}Free
          </Link>
        </nav>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Event type">
          <Link href={href({ type: undefined })} className={chip(!type)}>All types</Link>
          {EVENT_TYPES.map((t) => (
            <Link key={t.id} href={href({ type: t.id })} className={chip(type === t.id)}>{t.label}</Link>
          ))}
        </nav>
        <details className="text-sm" open={!!festival}>
          <summary className="cursor-pointer text-stone-600">More filters{festival && <>: <b>{festival}</b></>}</summary>
          <form className="mt-2 flex items-center gap-2" aria-label="Festival">
            <input type="hidden" name="metro" value={metro} />
            {type && <input type="hidden" name="type" value={type} />}
            {when !== "all" && <input type="hidden" name="when" value={when} />}
            {freeOnly && <input type="hidden" name="free" value="1" />}
            <select id="festival" name="festival" defaultValue={festival ?? ""} className="input w-auto py-1.5" aria-label="Festival">
              <option value="">Any festival</option>
              {FESTIVALS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button className="btn-outline py-1.5">Apply</button>
          </form>
        </details>
      </div>

      <FarNote far={far} metro={metro} />
      <p className="text-sm text-stone-600">
        {events.length} upcoming event{events.length === 1 ? "" : "s"} in {metroName(metro)}
        {type && <> · {eventTypeLabel(type)}</>}
        {festival && <> · {festival}</>}
        {q && <> matching &ldquo;{q}&rdquo;</>}
        {filtered && (
          <>
            {" · "}
            <Link href={`/events?metro=${metro}`} className="text-brand">Clear</Link>
          </>
        )}
      </p>

      {events.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-stone-600">
          <p>{filtered ? "No upcoming events match these filters." : `No upcoming events in ${metroName(metro)} yet.`}</p>
          {filtered && <Link href={`/events?metro=${metro}`} className="mt-3 inline-block font-semibold text-brand">See all dates and event types →</Link>}
          <Link href="/vendor/events/new" className="mt-3 inline-block font-semibold text-brand">Hosting one? Post it free →</Link>
        </div>
      )}
    </div>
  );
}
