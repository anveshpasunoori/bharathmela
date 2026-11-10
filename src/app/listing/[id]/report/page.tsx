import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/ReportForm";
import { db } from "@/lib/db";
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
        <ReportForm action={reportListing} hidden={{ listingId: listing.id }} />
      </div>
    </div>
  );
}
