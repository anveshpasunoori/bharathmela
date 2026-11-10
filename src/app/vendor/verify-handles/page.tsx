import Link from "next/link";
import { requireVendor } from "@/lib/auth";
import { checksFor } from "@/lib/creator-checks";
import { formatFollowers, platformLabel, profileUrl } from "@/lib/creators";
import { db } from "@/lib/db";
import { listingPath } from "@/lib/seo";
import { submitHandleCheck } from "../../actions/creator-checks";

export const metadata = { title: "Verify your handles", robots: { index: false } };

const STATUS: Record<string, { label: string; tone: string }> = {
  WAITING: { label: "Not verified", tone: "bg-stone-100 text-stone-600" },
  SUBMITTED: { label: "Waiting for our check", tone: "bg-amber-50 text-amber-800" },
  VERIFIED: { label: "✓ Verified", tone: "bg-green-50 text-green-800" },
  REJECTED: { label: "Not verified yet", tone: "bg-red-50 text-red-800" },
};

// Creators prove they own each handle by putting a short code in that profile's bio. Verified handles get
// a badge businesses can filter by.
export default async function VerifyHandlesPage() {
  const { vendor } = await requireVendor();
  const listings = await db.listing.findMany({
    where: { vendorId: vendor.id, category: "CREATORS", status: { not: "REMOVED" } },
    select: { id: true, title: true, details: true },
    orderBy: { createdAt: "asc" },
  });
  const sections = await Promise.all(listings.map(async (l) => ({ listing: l, rows: await checksFor(l) })));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/vendor" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold">Verify your handles</h1>
        <p className="text-stone-600">
          Businesses trust creators with a <b className="text-green-800">✓ Verified</b> badge, and can filter for them. It takes a minute:
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>Copy the code for a handle below and add it anywhere in that profile&apos;s bio.</li>
          <li>Tap <b>I&apos;ve added the code</b>. We look at your profile, usually within a day, and email you.</li>
          <li>Once verified, you can remove the code from your bio.</li>
        </ol>
      </div>

      {sections.length === 0 && (
        <div className="card space-y-2 text-center text-stone-600">
          <p>You don&apos;t have a creator profile yet.</p>
          <Link href="/vendor/listings/new?category=CREATORS" className="btn">Create your creator profile</Link>
        </div>
      )}

      {sections.map(({ listing, rows }) => (
        <section key={listing.id} className="card space-y-3">
          <h2 className="font-semibold">
            <Link href={listingPath(listing)} className="hover:text-brand">{listing.title}</Link>
          </h2>
          <ul className="space-y-3">
            {rows.map(({ check, platform }) => {
              const s = STATUS[check.status] ?? STATUS.WAITING;
              return (
                <li key={check.id} className="space-y-2 rounded-md bg-stone-50 p-3 ring-1 ring-stone-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a href={profileUrl(platform)} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-brand">
                      {platformLabel(platform.platform)} <span className="text-stone-500">@{platform.handle}</span> · {formatFollowers(platform.followers)}
                    </a>
                    <span className={`badge ${s.tone}`}>{s.label}</span>
                  </div>
                  {check.status !== "VERIFIED" && (
                    <p className="text-sm">
                      Code for your bio:{" "}
                      <code className="select-all rounded bg-white px-2 py-0.5 font-mono text-base font-bold tracking-wider text-brand ring-1 ring-orange-200">{check.code}</code>
                    </p>
                  )}
                  {check.reviewNote && check.status !== "VERIFIED" && <p className="text-sm text-red-700">{check.reviewNote}</p>}
                  {(check.status === "WAITING" || check.status === "REJECTED") && (
                    <form action={submitHandleCheck.bind(null, check.id)}>
                      <button className="btn py-1.5 text-sm">I&apos;ve added the code</button>
                    </form>
                  )}
                  {check.status === "SUBMITTED" && <p className="text-sm text-stone-600">Thanks! Keep the code in your bio until we email you.</p>}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-stone-500">
            Changing a handle in your profile resets its badge. If your follower count grows more than 25% past what we checked, submit again
            and we&apos;ll re-check.
          </p>
        </section>
      ))}
    </div>
  );
}
