import Image from "next/image";
import Link from "next/link";
import { homeEventPhoto } from "@/lib/home-art";
import type { UpcomingEvent } from "@/lib/event-data";
import { eventDateBadge, eventTypeLabel, formatEventHours } from "@/lib/events";
import { metroTimeZone } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { eventPath, snippet } from "@/lib/seo";
import { Reveal } from "./Reveal";
import { MobileViewAll, SectionHeading } from "./SectionHeading";

export function CommunityEvents({ events, allHref, where }: { events: UpcomingEvent[]; allHref: string; where: string }) {
  return (
    <Reveal className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" aria-labelledby="home-events">
      <SectionHeading id="home-events" icon="calendar" title="Community events" href={allHref} linkText="View all events" />
      {events.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const tz = metroTimeZone(e.metro);
            const d = eventDateBadge(e.startsAt, tz);
            const photo = homeEventPhoto(e);
            return (
              <article key={e.id} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-shadow duration-300 hover:shadow-md">
                <div className="relative aspect-[2/1] overflow-hidden">
                  <Image src={photo} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">{e.festival || eventTypeLabel(e.type)}</span>
                  <div className="absolute left-3 top-3 rounded-xl bg-white px-2.5 py-1.5 text-center leading-tight shadow-md">
                    <div className="text-xs font-bold uppercase tracking-wide text-saffron-dark">{d.weekday}</div>
                    <div className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">{d.month.charAt(0) + d.month.slice(1).toLowerCase()} {d.day}</div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <h3 className="text-xl font-semibold leading-snug text-ink">{e.title}</h3>
                  <p className="flex items-center gap-1.5 text-sm text-ink/80">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-forest" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
                    <span className="truncate">{e.venueName} · {formatEventHours(e.startsAt, e.endsAt, tz)}</span>
                  </p>
                  <p className="line-clamp-2 text-sm text-muted">{snippet(e.description, 140)}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className={`text-sm font-semibold ${e.isFree ? "text-forest" : "text-ink"}`}>{e.isFree ? "Free entry" : `From ${formatUSD(e.priceCents ?? 0)}`}</span>
                    <Link href={eventPath(e)} className="group/l inline-flex items-center gap-1.5 rounded-full border border-forest/30 px-5 py-2 text-sm font-semibold text-forest transition duration-150 hover:border-forest hover:bg-forest hover:text-snow">
                      Learn more <span aria-hidden className="transition-transform duration-150 group-hover/l:translate-x-0.5">→</span>
                      <span className="sr-only">about {e.title}</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">No upcoming events {where} yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Organizing a puja, a cultural night or a festival celebration? Post it free so the community can find it.</p>
          <Link href="/vendor/events/new" className="mt-5 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-snow transition hover:bg-forest-dark">Post an event</Link>
        </div>
      )}
      {events.length > 0 && <MobileViewAll href={allHref}>View all events</MobileViewAll>}
    </Reveal>
  );
}

export function EventsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading events">
      <div className="skeleton mb-6 h-9 w-60 rounded-lg" />
      <div className="skeleton h-48 rounded-2xl" />
    </section>
  );
}
