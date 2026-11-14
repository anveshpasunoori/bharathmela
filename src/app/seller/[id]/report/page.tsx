import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/ReportForm";
import { db } from "@/lib/db";
import { idFromSlugParam, sellerPath } from "@/lib/seo";
import { reportSeller } from "../../../actions/report";

export const metadata = { title: "Report a business", robots: { index: false } };

// Report a whole business: fake, impersonating someone, or scamming people. No account needed.
export default async function ReportSellerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const { sent } = await searchParams;
  const seller = await db.vendorProfile.findUnique({ where: { id: idFromSlugParam(id) }, select: { id: true, businessName: true, publicPath: true } });
  if (!seller) notFound();

  if (sent) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-xl font-bold">Thanks for reporting</h1>
        <p className="text-stone-600">Our team will look into {seller.businessName}. When several people report the same business, its listings come down until we check.</p>
        <p className="text-sm text-stone-600">
          If you lost money, also report it to your bank or card company right away, to local police, and at{" "}
          <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">reportfraud.ftc.gov</a>.
        </p>
        <Link href="/" className="btn">Back to BharathMela</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Report a business</h1>
      <p className="mb-4 mt-1 text-stone-600">
        <Link href={sellerPath(seller)} className="font-medium text-brand hover:underline">{seller.businessName}</Link>. Tell us if this business seems
        fake, is pretending to be someone else, or tried to scam you. Your report is private; the seller doesn&apos;t see who sent it.
      </p>
      <div className="card">
        <ReportForm action={reportSeller} hidden={{ vendorId: seller.id }} reasons={["FAKE_BUSINESS", "SCAM", "PAYMENT", "NO_DELIVERY", "MISLEADING", "SAFETY", "ILLEGAL", "DISCRIMINATION", "PHOTO", "COPYRIGHT", "OTHER"]} />
      </div>
    </div>
  );
}
