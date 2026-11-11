import Image from "next/image";
import { homeEventPhoto } from "@/lib/home-art";
import Link from "next/link";
import { eventPath } from "@/lib/seo";
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

// Shared event tile for browse, the events directory, and seller pages.
export function EventCard({ event }: { event: CardEvent }) {
  const tz = metroTimeZone(event.metro);
  const date = eventDateBadge(event.startsAt, tz);
  const photo = homeEventPhoto(event);
  return (
    <Link
      href={eventPath(event)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-brand-soft">
        <Image src={photo} alt="" fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105" />
        <div className="absolute left-3 top-3 min-w-[3.75rem] rounded-lg bg-white px-2 py-2 text-center leading-tight text-brand shadow-sm">
          <div className="text-xs font-semibold tracking-wide">{date.month}</div>
          <div className="text-2xl font-bold">{date.day}</div>
          <div className="text-xs text-stone-600">{date.weekday}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1 p-4">
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
