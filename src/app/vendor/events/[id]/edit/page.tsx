import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { EventFields } from "@/components/EventFields";
import { EventConfirm, EventRulesBox } from "@/components/EventRulesBox";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { utcToLocalInput } from "@/lib/events";
import { metroName, metroTimeZone } from "@/lib/metros";
import { updateEvent } from "../../../../actions/event";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event || event.vendorId !== vendor.id) notFound();
  const tz = metroTimeZone(event.metro);

  if (event.status === "REMOVED") {
    return (
      <div className="card mx-auto max-w-lg">
        <h1 className="text-xl font-bold">This event was removed</h1>
        <p className="mt-2 text-stone-600">Reason: {event.moderationNote || "it broke our rules"}. Removed events can&apos;t be edited.</p>
        <Link href="/vendor?tab=events" className="btn mt-4">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/vendor?tab=events" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
      <h1 className="mt-2 text-2xl font-bold">Edit event</h1>
      {event.status === "REJECTED" && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Not approved: {event.moderationNote}. Fix this and save to send it for review again.
        </p>
      )}
      <div className="card mt-4">
        <ActionForm action={updateEvent} submitLabel="Save changes">
          <input type="hidden" name="eventId" value={event.id} />
          <EventRulesBox />
          <EventFields
            cityLabel={metroName(event.metro)}
            initial={{
              title: event.title,
              description: event.description,
              type: event.type,
              festival: event.festival,
              startsAt: utcToLocalInput(event.startsAt, tz),
              endsAt: utcToLocalInput(event.endsAt, tz),
              venueName: event.venueName,
              address: event.address,
              isFree: event.isFree,
              price: event.priceCents != null ? (event.priceCents / 100).toFixed(2) : "",
              ticketUrl: event.ticketUrl,
            }}
          />
          <EventConfirm />
        </ActionForm>
      </div>
    </div>
  );
}
