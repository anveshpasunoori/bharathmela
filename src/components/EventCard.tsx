import Link from "next/link";
import { eventDateBadge, eventTypeLabel, formatEventTime } from "@/lib/events";
import { metroTimeZone } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";

type CardEvent = {
  id: string;
  title: string;
  type: string;
  festival: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  metro: string;
  isFree: boolean;
  priceCents: number | null;
  vendor: { businessName: string };
};

export function EventCard({ event }: { event: CardEvent }) {
  const tz = metroTimeZone(event.metro);
  const badge = eventDateBadge(event.startsAt, tz);
  return (
    <Link href={`/events/${event.id}`} className="card flex min-w-0 gap-4 transition hover:shadow-md">
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-soft text-brand ring-1 ring-orange-200">
        <span className="text-[11px] font-semibold">{badge.month}</span>
        <span className="text-xl font-bold leading-none">{badge.day}</span>
        <span className="text-[11px]">{badge.weekday}</span>
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap gap-1.5">
          {event.festival ? (
            <span className="badge bg-orange-100 text-orange-800">{event.festival}</span>
          ) : (
            <span className="badge bg-stone-100 text-stone-600">{eventTypeLabel(event.type)}</span>
          )}
          <span className={`badge ${event.isFree ? "bg-green-50 text-green-800" : "bg-stone-100 text-stone-700"}`}>
            {event.isFree ? "Free" : `From ${formatUSD(event.priceCents ?? 0)}`}
          </span>
        </div>
        <h3 className="font-semibold">{event.title}</h3>
        <p className="text-sm text-stone-600">{formatEventTime(event.startsAt, event.endsAt, tz)}</p>
        <p className="truncate text-sm text-stone-500">
          {event.venueName} · by {event.vendor.businessName}
        </p>
      </div>
    </Link>
  );
}
