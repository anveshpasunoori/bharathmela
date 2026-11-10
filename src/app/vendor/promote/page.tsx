import Link from "next/link";
import QRCode from "qrcode";
import { PrintButton } from "@/components/PrintButton";
import { ShareButtons } from "@/components/ShareButtons";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { FOUNDING_PRO_DAYS, FOUNDING_SELLERS_PER_CITY, REFERRAL_PRO_DAYS, REFERRAL_REWARDS_PER_YEAR } from "@/lib/growth";
import { metroName } from "@/lib/metros";
import { absoluteUrl, sellerPath, siteUrl, cityCategoryPath } from "@/lib/seo";

export const metadata = { title: "Share your business", robots: { index: false } };

// Everything a seller needs to bring buyers and other sellers: their page link to share, a QR code and a
// printable poster for their shop, packaging or stall, and a referral link that earns free Pro months.
export default async function PromotePage() {
  const { user, vendor } = await requireVendor();
  const pageUrl = absoluteUrl(sellerPath(vendor));
  // The QR code is tagged so scans show up as their own source.
  const qrTarget = `${pageUrl}?utm_source=qr&utm_medium=print&utm_campaign=seller-poster`;
  const referralUrl = absoluteUrl(`/vendor/signup?ref=${vendor.id}`);
  const [qrSvg, qrPng, referred, rewarded, founders] = await Promise.all([
    QRCode.toString(qrTarget, { type: "svg", margin: 1, color: { dark: "#1c1917", light: "#ffffff" } }),
    QRCode.toDataURL(qrTarget, { margin: 2, width: 1024 }),
    db.vendorProfile.count({ where: { referredById: vendor.id } }),
    db.subscription.count({ where: { vendorId: vendor.id, source: "REFERRAL" } }),
    db.vendorProfile.count({ where: { metro: vendor.metro, foundingSeller: true } }),
  ]);
  const city = metroName(vendor.metro);
  const foundingLeft = Math.max(0, FOUNDING_SELLERS_PER_CITY - founders);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="print:hidden">
        <Link href="/vendor" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold">Share your business</h1>
        <p className="text-stone-600">Most of your customers will come from people you already know. Share your page wherever they are.</p>
      </div>

      <section className="card space-y-3 print:hidden">
        <h2 className="font-semibold">1. Share your page</h2>
        <p className="text-sm text-stone-600">
          Post it in your community WhatsApp and Facebook groups, put it in your WhatsApp status, and send it to past customers so they can
          leave a review.
        </p>
        <p className="break-all rounded-md bg-stone-50 px-3 py-2 font-mono text-sm text-stone-700 ring-1 ring-stone-200">{pageUrl}</p>
        <ShareButtons url={pageUrl} text={`Find ${vendor.businessName} on BharathMela:`} campaign="seller-page" />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="font-semibold">Get promoted by a local creator</h2>
          <p className="text-sm text-stone-600">Food bloggers and influencers in {city}, and nationwide. Many take barter: a free meal or product for a post.</p>
        </div>
        <Link href={cityCategoryPath(vendor.metro, "CREATORS")} className="btn-outline whitespace-nowrap">Find a creator</Link>
      </section>

      <section className="card space-y-3 print:hidden">
        <h2 className="font-semibold">2. Print your QR code</h2>
        <p className="text-sm text-stone-600">
          Put it on your packaging, your shop counter, flyers or your stall at a mela. People scan it with their phone camera to see your page,
          reviews and contact details.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={qrPng} download={`${vendor.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`} className="btn-outline">
            Download QR code
          </a>
          <PrintButton label="Print poster" />
        </div>
      </section>

      {/* The poster: what prints. */}
      <section className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200 print:max-w-none print:p-0 print:ring-0">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Find us on BharathMela</p>
        <h2 className="mt-2 text-3xl font-bold">{vendor.businessName}</h2>
        <p className="mt-1 text-stone-600">{city}</p>
        <div className="mx-auto mt-5 w-64 print:w-80" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p className="mt-4 text-lg font-semibold">Scan to see what we offer, prices and reviews</p>
        <p className="mt-1 text-stone-600">and message, call or WhatsApp us directly.</p>
        <p className="mt-4 text-sm font-semibold text-brand">{new URL(siteUrl()).hostname.replace(/^www\./, "")}</p>
      </section>

      <section className="card space-y-3 print:hidden">
        <h2 className="font-semibold">3. Invite other sellers, get Pro free</h2>
        <p className="text-sm text-stone-600">
          Know a home cook, tutor, pujari or anyone with a small business? When someone joins through your link and posts their first listing,
          you get <b>{REFERRAL_PRO_DAYS} days of Pro free</b> (up to {REFERRAL_REWARDS_PER_YEAR} months a year).
        </p>
        <p className="break-all rounded-md bg-stone-50 px-3 py-2 font-mono text-sm text-stone-700 ring-1 ring-stone-200">{referralUrl}</p>
        <ShareButtons url={referralUrl} text="List your business free on BharathMela, the marketplace for our community:" campaign="seller-referral" />
        <p className="text-sm text-stone-600">
          {referred ? (
            <>
              <b>{referred}</b> seller{referred === 1 ? " has" : "s have"} joined through your link · <b>{rewarded}</b> free month
              {rewarded === 1 ? "" : "s"} earned.
            </>
          ) : (
            "No one has joined through your link yet."
          )}
        </p>
      </section>

      {!user.emailVerifiedAt && !vendor.foundingSeller && foundingLeft > 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 print:hidden">
          The first {FOUNDING_SELLERS_PER_CITY} sellers in {city} get {FOUNDING_PRO_DAYS} days of Pro free. <Link href="/verify?next=/vendor/promote" className="font-semibold underline">Verify your email</Link> to claim your spot.
        </p>
      )}
    </div>
  );
}
