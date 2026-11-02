import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { REPORT_REASONS } from "@/lib/legal";
import { reportListing } from "../../../actions/report";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const listing = await db.listing.findUnique({ where: { id }, select: { id: true, title: true, metro: true } });
  if (!listing) notFound();

  if (sent) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">Thanks for reporting</h1>
        <p className="mt-2 text-stone-600">Our team will review this listing. If you were defrauded or are in danger, contact local police.</p>
        <Link href={`/?metro=${listing.metro}`} className="btn mt-4">Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Report a listing</h1>
      <p className="mb-4 mt-1 text-stone-600">&ldquo;{listing.title}&rdquo;</p>
      <div className="card">
        <ActionForm action={reportListing} submitLabel="Send report">
          <input type="hidden" name="listingId" value={listing.id} />
          <div>
            <label className="label" htmlFor="reason">What&apos;s wrong?</label>
            <select className="input" id="reason" name="reason" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="details">Details (optional)</label>
            <textarea className="input min-h-24" id="details" name="details" maxLength={2000} />
          </div>
          <div>
            <label className="label" htmlFor="email">Your email (optional, if you want a reply)</label>
            <input className="input" id="email" name="email" type="email" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
