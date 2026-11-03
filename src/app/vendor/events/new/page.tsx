import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { EventFields } from "@/components/EventFields";
import { EventConfirm, EventRulesBox } from "@/components/EventRulesBox";
import { requireVendor } from "@/lib/auth";
import { metroName } from "@/lib/metros";
import { createEvent } from "../../../actions/event";

export const metadata = { title: "New event – DesiBazaar" };

export default async function NewEventPage() {
  const { vendor } = await requireVendor();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/vendor#events" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Post an event</h1>
      <p className="mb-4 text-stone-600">Concerts, dance shows, festival celebrations, pujas, workshops and community gatherings in {metroName(vendor.metro)}.</p>
      <div className="card">
        <ActionForm action={createEvent} submitLabel="Publish event">
          <EventRulesBox />
          <EventFields cityLabel={metroName(vendor.metro)} />
          <EventConfirm />
        </ActionForm>
      </div>
    </div>
  );
}
