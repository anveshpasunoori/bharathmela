import Image from "next/image";
import Link from "next/link";
import { homeEventPhoto } from "@/lib/home-art";
import type { UpcomingEvent } from "@/lib/event-data";
import { eventDateBadge, eventTypeLabel, formatEventHours } from "@/lib/events";
import { metroTimeZone } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { eventPath, snippet } from "@/lib/seo";
import { EventCarousel } from "./EventCarousel";
import { Reveal } from "./Reveal";
import { MobileViewAll, SectionHeading } from "./SectionHeading";

// Events have no photos, so each card gets a festive panel colored by the kind of event.
const PANELS: Record<string, [string, string]> = {
  FESTIVAL: ["#F47721", "#B5175E"],
  CONCERT: ["#6D28D9", "#B5175E"],
  DANCE: ["#B5175E", "#F47721"],
  RELIGIOUS: ["#E8A317", "#C2410C"],
  COMMUNITY: ["#145638", "#0E6B66"],
  WORKSHOP: ["#0E6B66", "#145638"],
  KIDS: ["#F6A821", "#0E6B66"],
  COMEDY: ["#7C2D12", "#B5175E"],
};

function EventPanel({ type }: { type: string }) {
  const [a, b] = PANELS[type] ?? ["#145638", "#F47721"];
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg aria-hidden viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full transition duration-700 group-hover:scale-105">
      <defs>
        <linearGradient id={`ev-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ev-${type})`} />
      <g transform="translate(250 100)" fill="#fff" opacity="0.16">
        {petals.map((r) => <ellipse key={r} cx="0" cy="-58" rx="13" ry="30" transform={`rotate(${r})`} />)}
        <circle r="26" />
      </g>
      <g transform="translate(250 100)" fill="none" stroke="#fff" strokeOpacity="0.28">
        <circle r="78" strokeDasharray="3 6" />
        <circle r="96" />
      </g>
      {/* String of lights */}
      <path d="M0 18 Q80 48 160 22 T320 26" fill="none" stroke="#fff" strokeOpacity="0.4" />
      {[20, 60, 100, 140, 180, 220, 260, 300].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 ? 34 : 30} r="3.5" fill="#FFE7A3" opacity="0.85" />
      ))}
    </svg>
  );
}

export function CommunityEvents({ events, allHref, where }: { events: UpcomingEvent[]; allHref: string; where: string }) {
  return (
    <Reveal className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" aria-labelledby="home-events">
      <SectionHeading id="home-events" icon="calendar" title="Community events" href={allHref} linkText="View all events" />
      {events.length ? (
        <EventCarousel label="Upcoming community events">
          {events.map((e) => {
            const tz = metroTimeZone(e.metro);
            const d = eventDateBadge(e.startsAt, tz);
            const photo = homeEventPhoto(e);
            return (
              <article key={e.id} className="group grid overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition duration-300 hover:shadow-[0_22px_40px_-20px_rgba(32,41,35,0.35)] sm:grid-cols-[17rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
                <div className="relative h-40 overflow-hidden sm:h-full sm:min-h-44">
                  {photo ? (
                    <Image src={photo} alt="" fill sizes="(min-width: 640px) 480px, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <EventPanel type={e.type} />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">{e.festival || eventTypeLabel(e.type)}</span>
                  <div className="absolute bottom-4 right-4 rounded-xl bg-white px-3 py-2 text-center leading-tight shadow-md sm:bottom-auto sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
                    <div className="text-xs font-bold uppercase tracking-wide text-saffron-dark">{d.weekday}</div>
                    <div className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">{d.month.charAt(0) + d.month.slice(1).toLowerCase()} {d.day}</div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-2 p-5 sm:p-7">
                  <h3 className="text-xl font-semibold leading-snug text-ink">{e.title}</h3>
                  <p className="flex items-center gap-1.5 text-sm text-ink/80">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-forest" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
                    <span className="truncate">{e.venueName} · {formatEventHours(e.startsAt, e.endsAt, tz)}</span>
                  </p>
                  <p className="line-clamp-2 text-sm text-muted">{snippet(e.description, 140)}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
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
        </EventCarousel>
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
