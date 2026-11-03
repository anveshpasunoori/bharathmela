import Link from "next/link";
import { eventDateBadge, eventTypeLabel, formatEventHours } from "@/lib/events";
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

// One event in a list: the date once, on the left, then what, when and where. Sized by padding, not fixed
// widths, so larger text settings don't break it.
export function EventCard({ event }: { event: CardEvent }) {
  const tz = metroTimeZone(event.metro);
  const date = eventDateBadge(event.startsAt, tz);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex min-w-0 items-start gap-4 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm sm:p-5"
    >
      <div className="min-w-[3.75rem] shrink-0 rounded-lg bg-brand-soft px-2 py-2 text-center leading-tight text-brand">
        <div className="text-xs font-semibold tracking-wide">{date.month}</div>
        <div className="text-2xl font-bold">{date.day}</div>
        <div className="text-xs text-stone-600">{date.weekday}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-brand">{event.title}</h3>
        <p className="mt-1 text-sm text-stone-600">
          {formatEventHours(event.startsAt, event.endsAt, tz)} · {event.venueName}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          <span className={event.festival ? "font-medium text-brand" : ""}>{event.festival || eventTypeLabel(event.type)}</span>
          {" · "}
          <span className={event.isFree ? "font-medium text-green-700" : "font-medium text-stone-700"}>
            {event.isFree ? "Free" : `From ${formatUSD(event.priceCents ?? 0)}`}
          </span>
          {" · "}
          {event.vendor.businessName}
        </p>
      </div>
    </Link>
  );
}
