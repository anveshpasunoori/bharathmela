import Link from "next/link";
import { deleteListing, setListingVisibility } from "../actions/vendor";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan, syncExpirations } from "@/lib/billing";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { PLANS, formatUSD } from "@/lib/plans";
import { ratingsFor } from "@/lib/reviews";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Stars } from "@/components/Stars";

const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string; review?: string; published?: string; updated?: string }>;
}) {
  const { vendor } = await requireVendor();
  const params = await searchParams;
  await syncExpirations();

  const [{ plan, subscription }, listings, payments, ratings] = await Promise.all([
    getVendorPlan(vendor.id),
    db.listing.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({
      where: { vendorId: vendor.id },
      include: { subscription: true, adBoost: { include: { listing: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    ratingsFor([vendor.id]),
  ]);
  const now = new Date();
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const usedCount = listings.filter((l) => l.status === "ACTIVE" || l.status === "PENDING_REVIEW").length;
  const canAdd = usedCount < plan.maxListings;
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const rating = ratings.get(vendor.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{vendor.businessName}</h1>
          <p className="text-stone-600">{metroName(vendor.metro)}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-brand">
          <Link href="/vendor/profile">Edit profile</Link>
          <Link href="/vendor/reviews">Ratings & replies</Link>
          <Link href={`/seller/${vendor.id}`}>Public page →</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3">
          <p className="text-xs text-stone-500">Live listings</p>
          <p className="text-xl font-semibold">{activeCount}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-stone-500">Listing views</p>
          <p className="text-xl font-semibold">{totalViews.toLocaleString()}</p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-stone-500">Rating</p>
          {rating ? <Stars rating={rating.average} count={rating.count} /> : <p className="text-sm text-stone-500">No ratings yet</p>}
        </div>
      </div>

      {params.submitted && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks! We received your payment details and will confirm within 1 business day.
        </p>
      )}
      {params.review && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your listing was sent for review. We check new sellers, rentals, domestic help and anything our filters flag, usually within 1
          business day. You&apos;ll see it go live here.
        </p>
      )}
      {(params.published || params.updated) && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          {params.published ? "Your listing is live." : "Your changes are saved."}
        </p>
      )}
      {params.error === "limit" && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          You&apos;ve reached your plan&apos;s listing limit. Hide another listing or upgrade.
        </p>
      )}

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Current plan</p>
          <p className="text-xl font-semibold">{plan.name}</p>
          <p className="text-sm text-stone-600">
            {usedCount} of {plan.maxListings} listings used (live and in review)
            {subscription?.endsAt && <> · renews by payment before {fmtDate(subscription.endsAt)}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.id !== "PRO" && (
            <Link href="/vendor/upgrade?plan=PRO" className="btn">
              Upgrade to Pro · {formatUSD(PLANS.PRO.priceCents)}
            </Link>
          )}
          {plan.id === "FREE" && (
            <Link href="/vendor/upgrade?plan=BASIC" className="btn-outline">
              Basic · {formatUSD(PLANS.BASIC.priceCents)}
            </Link>
          )}
          {plan.id !== "FREE" && (
            <Link href={`/vendor/upgrade?plan=${plan.id}`} className="btn-outline">
              Renew {plan.name}
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          {canAdd ? (
            <Link href="/vendor/listings/new" className="btn">
              + New listing
            </Link>
          ) : (
            <span className="text-sm text-stone-500">Limit reached – upgrade to add more</span>
          )}
        </div>
        {listings.length === 0 && <p className="card text-stone-600">No listings yet. Add your first one!</p>}
        <ul className="space-y-3">
          {listings.map((l) => {
            const featured = l.featuredUntil && l.featuredUntil > now;
            return (
              <li key={l.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{l.title}</span>
                    <ListingStatus status={l.status} />
                    {featured && <span className="badge bg-brand text-white">Featured until {fmtDate(l.featuredUntil!)}</span>}
                  </div>
                  <p className="text-sm text-stone-500">
                    {categoryLabel(l.category)} · {l.views.toLocaleString()} view{l.views === 1 ? "" : "s"}
                  </p>
                  {(l.status === "REJECTED" || l.status === "REMOVED") && l.moderationNote && (
                    <p className="mt-1 text-sm text-red-700">Reason: {l.moderationNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {l.status === "ACTIVE" && (
                    <Link href={`/vendor/listings/${l.id}/boost`} className="btn py-1.5">
                      {featured ? "Extend feature" : "Feature this"}
                    </Link>
                  )}
                  {l.status !== "REMOVED" && (
                    <Link href={`/vendor/listings/${l.id}/edit`} className="btn-outline py-1.5">
                      {l.status === "REJECTED" ? "Fix & resubmit" : "Edit"}
                    </Link>
                  )}
                  {(l.status === "ACTIVE" || l.status === "HIDDEN") && (
                    <form action={setListingVisibility.bind(null, l.id, l.status !== "ACTIVE")}>
                      <button className="btn-outline py-1.5">{l.status === "ACTIVE" ? "Hide" : "Show"}</button>
                    </form>
                  )}
                  <ConfirmButton action={deleteListing.bind(null, l.id)} message={`Delete "${l.title}"? This can't be undone.`}>
                    Delete
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {payments.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Payments</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">For</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="px-4 py-2">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-2">
                      {p.subscription
                        ? `${PLANS[p.subscription.plan as keyof typeof PLANS].name} plan`
                        : `Feature “${p.adBoost?.listing.title}” for ${p.adBoost?.days} days`}
                    </td>
                    <td className="px-4 py-2">{formatUSD(p.amountCents)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={p.status} />
                      {p.adminNote && <span className="ml-2 text-stone-500">{p.adminNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ListingStatus({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    ACTIVE: ["Live", "bg-green-100 text-green-800"],
    HIDDEN: ["Hidden", "bg-stone-200 text-stone-700"],
    PENDING_REVIEW: ["In review", "bg-amber-100 text-amber-800"],
    REJECTED: ["Not approved", "bg-red-100 text-red-800"],
    REMOVED: ["Removed", "bg-red-100 text-red-800"],
  };
  const [label, style] = map[status] ?? [status, ""];
  return <span className={`badge ${style}`}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = { PENDING: "Waiting for confirmation", APPROVED: "Confirmed", REJECTED: "Rejected" };
  return <span className={`badge ${styles[status] ?? ""}`}>{labels[status] ?? status}</span>;
}
