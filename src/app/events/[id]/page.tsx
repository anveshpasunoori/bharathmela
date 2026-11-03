import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactButtons } from "@/components/ContactButtons";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicEventWhere } from "@/lib/event-data";
import { eventTypeLabel, formatEventTime } from "@/lib/events";
import { EVENT_DISCLAIMER } from "@/lib/legal";
import { metroName, metroTimeZone } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";

async function getEvent(id: string) {
  return db.event.findFirst({ where: { id, ...publicEventWhere() }, include: { vendor: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return event
    ? { title: `${event.title} | BharathMela Events`, description: event.description.slice(0, 160) }
    : { title: "Event not found | BharathMela" };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const user = await getCurrentUser();
  if (user?.id !== event.vendor.userId) {
    await db.event.update({ where: { id: event.id }, data: { views: { increment: 1 } } });
  }
  const tz = metroTimeZone(event.metro);
  const online = /^online$/i.test(event.venueName.trim());
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}`)}`;
  const googleCal = new URL("https://calendar.google.com/calendar/render");
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  googleCal.searchParams.set("action", "TEMPLATE");
  googleCal.searchParams.set("text", event.title);
  googleCal.searchParams.set("dates", `${stamp(event.startsAt)}/${stamp(event.endsAt)}`);
  googleCal.searchParams.set("location", `${event.venueName}, ${event.address}`);
  googleCal.searchParams.set("details", event.description.slice(0, 1000));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/events?metro=${event.metro}`} className="text-sm text-stone-500 hover:text-brand">
        ← Events in {metroName(event.metro)}
      </Link>
      <article className="card space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {event.festival && <span className="badge bg-orange-100 text-orange-800">{event.festival}</span>}
          <span className="badge bg-stone-100 text-stone-600">{eventTypeLabel(event.type)}</span>
        </div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">When</dt>
            <dd className="font-medium">{formatEventTime(event.startsAt, event.endsAt, tz)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Where</dt>
            <dd className="font-medium">
              {event.venueName}
              <br />
              <span className="font-normal text-stone-600">{event.address}</span>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Entry</dt>
            <dd className="font-medium">{event.isFree ? "Free" : `From ${formatUSD(event.priceCents ?? 0)}`}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Organizer</dt>
            <dd>
              <Link href={`/seller/${event.vendorId}`} className="font-medium hover:text-brand">{event.vendor.businessName}</Link>
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {event.ticketUrl && (
            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn">
              {event.isFree ? "RSVP" : "Get tickets"} ↗
            </a>
          )}
          <details data-dropdown className="relative">
            <summary className="btn-outline cursor-pointer list-none">📅 Add to calendar</summary>
            <div className="absolute z-10 mt-1 w-48 rounded-lg border border-stone-200 bg-white p-1 text-sm shadow-lg">
              <a href={googleCal.toString()} target="_blank" rel="noopener noreferrer" className="block rounded px-3 py-2 hover:bg-stone-100">Google Calendar</a>
              <a href={`/events/${event.id}/calendar.ics`} className="block rounded px-3 py-2 hover:bg-stone-100">Apple / Outlook</a>
            </div>
          </details>
          {!online && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">📍 Directions</a>
          )}
        </div>
        <p className="whitespace-pre-line text-stone-700">{event.description}</p>
      </article>

      <div className="card space-y-3">
        <p className="text-sm text-stone-600">Questions about this event? Contact the organizer.</p>
        <ContactButtons phone={event.vendor.phone} whatsapp={event.vendor.whatsapp} name={event.vendor.businessName} />
      </div>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p>{EVENT_DISCLAIMER}</p>
        {event.ticketUrl && <p className="mt-1">Tickets are sold on {new URL(event.ticketUrl).hostname.replace(/^www\./, "")}, not BharathMela.</p>}
        <Link href={`/events/${event.id}/report`} className="mt-2 inline-block font-semibold text-red-700 hover:underline">
          Report this event
        </Link>
      </div>
    </div>
  );
}
