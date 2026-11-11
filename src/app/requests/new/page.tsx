import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { RequestFields } from "@/components/RequestFields";
import { requireUser } from "@/lib/auth";
import { MAX_NOTIFIED, REQUEST_CATEGORIES, REQUEST_DAYS } from "@/lib/service-requests";
import { metroFor, placeFromZip } from "@/lib/geo";
import { isMetro, metroName } from "@/lib/metros";
import { getUserLocation } from "@/lib/user-location";
import { createRequest } from "../../actions/service-request";

export const metadata = { title: "Post what you need", robots: { index: false } };

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ category?: string; metro?: string }> }) {
  const params = await searchParams;
  const category = REQUEST_CATEGORIES.find((c) => c.id === params.category)?.id;
  const metro = isMetro(params.metro) ? params.metro : undefined;
  const query = new URLSearchParams();
  if (metro) query.set("metro", metro);
  if (params.category === "ROOM_RENTAL") redirect(`/rooms-wanted/new${query.size ? `?${query}` : ""}`);
  if (category) query.set("category", category);
  const next = `/requests/new${query.size ? `?${query}` : ""}`;
  const user = await requireUser(next);
  if (!user.emailVerifiedAt) redirect(`/verify?next=${encodeURIComponent(next)}`);
  const place = await getUserLocation();
  const zip = place?.zip ?? user.vendor?.zip ?? "";
  const zipPlace = metro && zip ? place ?? placeFromZip(zip) : null;
  const initialZip = !metro || (zipPlace && metroFor(zipPlace).metro === metro) ? zip : "";
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/requests" className="text-sm text-stone-500 hover:text-brand">← My requests</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{category === "CREATORS" ? "Post a collab request" : "Post what you need"}</h1>
      {category === "CREATORS" ? (
        <p className="mb-4 text-stone-600">
          Free. We&apos;ll email up to {MAX_NOTIFIED} matching creators (verified ones first), and they&apos;ll send you their ideas and prices.
          Your request stays open for {REQUEST_DAYS} days.
        </p>
      ) : (
        <p className="mb-4 text-stone-600">
          Free. We&apos;ll email up to {MAX_NOTIFIED} sellers near you who offer this, and they&apos;ll send you quotes. Your request stays open
          for {REQUEST_DAYS} days. Looking for a room? <Link href="/rooms-wanted/new" className="font-semibold text-brand">Post that here</Link>.
        </p>
      )}
      <div className="card">
        <ActionForm action={createRequest} submitLabel="Get quotes">
          <RequestFields
            categories={REQUEST_CATEGORIES}
            initialCategory={category ?? ""}
            initialZip={initialZip}
            areaLabel={metro ? metroName(metro) : undefined}
          />
        </ActionForm>
      </div>
    </div>
  );
}
