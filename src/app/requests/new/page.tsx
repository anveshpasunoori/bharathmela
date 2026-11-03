import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { RequestFields } from "@/components/RequestFields";
import { requireUser } from "@/lib/auth";
import { MAX_NOTIFIED, REQUEST_CATEGORIES, REQUEST_DAYS } from "@/lib/service-requests";
import { getUserLocation } from "@/lib/user-location";
import { createRequest } from "../../actions/service-request";

export const metadata = { title: "Post what you need", robots: { index: false } };

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  if (category === "ROOM_RENTAL") redirect("/rooms-wanted/new");
  const user = await requireUser(`/requests/new${category ? `?category=${category}` : ""}`);
  if (!user.emailVerifiedAt) redirect("/verify?next=/requests/new");
  const place = await getUserLocation();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/requests" className="text-sm text-stone-500 hover:text-brand">← My requests</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Post what you need</h1>
      <p className="mb-4 text-stone-600">
        Free. We&apos;ll email up to {MAX_NOTIFIED} sellers near you who offer this, and they&apos;ll send you quotes. Your request stays open
        for {REQUEST_DAYS} days. Looking for a room? <Link href="/rooms-wanted/new" className="font-semibold text-brand">Post that here</Link>.
      </p>
      <div className="card">
        <ActionForm action={createRequest} submitLabel="Get quotes">
          <RequestFields
            categories={REQUEST_CATEGORIES}
            initialCategory={REQUEST_CATEGORIES.some((c) => c.id === category) ? category! : ""}
            initialZip={place?.zip ?? user.vendor?.zip ?? ""}
          />
        </ActionForm>
      </div>
    </div>
  );
}
