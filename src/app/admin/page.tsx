import Link from "next/link";
import { approve, reject, resolveReport, setReviewVisibility } from "../actions/admin";
import { reportReasonLabel } from "@/lib/legal";
import { syncExpirations } from "@/lib/billing";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { PLANS, formatUSD } from "@/lib/plans";

const fmtDate = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AdminPage() {
  await syncExpirations();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [heldReviews, latestReviews, reports, pending, recent, revenue, vendorCount, activeSubs] = await Promise.all([
    db.review.findMany({
      where: { status: "PENDING" },
      include: { buyer: { select: { name: true, email: true, createdAt: true } }, vendor: { select: { businessName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    db.review.findMany({
      where: { status: { not: "PENDING" } },
      include: { buyer: { select: { name: true, email: true } }, vendor: { select: { businessName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
    db.report.findMany({
      where: { status: "OPEN" },
      include: {
        listing: { include: { vendor: { select: { businessName: true } } } },
        event: { include: { vendor: { select: { businessName: true } } } },
        roomWanted: { include: { user: { select: { name: true, email: true } } } },
        serviceRequest: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.payment.findMany({
      where: { status: "PENDING" },
      include: { vendor: true, subscription: true, adBoost: { include: { listing: { select: { title: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.payment.findMany({
      where: { status: { not: "PENDING" } },
      include: { vendor: true },
      orderBy: { reviewedAt: "desc" },
      take: 15,
    }),
    db.payment.aggregate({ where: { status: "APPROVED", reviewedAt: { gte: monthStart } }, _sum: { amountCents: true } }),
    db.vendorProfile.count(),
    db.subscription.groupBy({ by: ["plan"], where: { status: "ACTIVE", endsAt: { gt: new Date() } }, _count: true }),
  ]);

  // Same transaction ID on more than one payment is a red flag for a reused or fake reference.
  const refCounts = await db.payment.groupBy({
    by: ["reference"],
    where: { reference: { in: pending.map((p) => p.reference) } },
    _count: true,
  });
  const duplicateRefs = new Set(refCounts.filter((r) => r._count > 1).map((r) => r.reference));

  const describe = (p: (typeof pending)[number]) =>
    p.subscription
      ? `${PLANS[p.subscription.plan as keyof typeof PLANS].name} plan`
      : `Feature “${p.adBoost?.listing.title}” · ${p.adBoost?.days} days`;

  return (
    <div className="space-y-8">

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Revenue this month" value={formatUSD(revenue._sum.amountCents ?? 0)} />
        <Stat label="Payments / reports to review" value={`${pending.length} / ${reports.length}`} />
        <Stat label="Sellers" value={String(vendorCount)} />
        <Stat
          label="Paid plans"
          value={activeSubs.map((s) => `${s._count} ${PLANS[s.plan as keyof typeof PLANS].name}`).join(" · ") || "0"}
        />
      </div>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Reported listings</h2>
        <p className="mb-3 text-sm text-stone-600">
          Review reports promptly. Remove anything illegal, discriminatory or unsafe. Removing closes all open reports on that listing, and the
          seller can&apos;t bring it back.
        </p>
        {reports.length === 0 && <p className="card text-stone-600">No open reports.</p>}
        <ul className="space-y-3">
          {reports.map((r) => {
            const target = r.listing ?? r.event ?? r.roomWanted ?? r.serviceRequest;
            if (!target) return null;
            const kind = r.listing ? "listing" : r.event ? "event" : r.roomWanted ? "room request" : "service request";
            const url = r.listing ? `/listing/${target.id}` : r.event ? `/events/${target.id}` : r.roomWanted ? `/rooms-wanted/${target.id}` : `/requests/${target.id}`;
            const owner = "vendor" in target ? target.vendor.businessName : `${target.user.name} (${target.user.email})`;
            return (
            <li key={r.id} className="card space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  <span className="badge mr-2 bg-red-100 text-red-800">{reportReasonLabel(r.reason)}</span>
                  <span className="badge mr-2 bg-stone-100 text-stone-600">{kind}</span>
                  <Link href={url} className="hover:text-brand" target="_blank">
                    {target.title}
                  </Link>
                </p>
                <p className="text-sm text-stone-500">{fmtDate(r.createdAt)}</p>
              </div>
              <p className="text-sm text-stone-600">
                Posted by: {owner} · Status: {target.status.toLowerCase().replace("_", " ")}
                {r.reporterEmail && <> · Reporter: {r.reporterEmail}</>}
              </p>
              {r.details && <p className="rounded-md bg-stone-50 px-3 py-2 text-sm">{r.details}</p>}
              <div className="flex flex-wrap gap-2">
                <form action={resolveReport.bind(null, r.id, true)} className="flex flex-1 gap-2">
                  <input name="note" className="input" placeholder="Reason (shown to seller)" />
                  <button className="btn whitespace-nowrap">Remove {kind}</button>
                </form>
                <form action={resolveReport.bind(null, r.id, false)}>
                  <button className="btn-outline">Dismiss</button>
                </form>
              </div>
            </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Payments to confirm</h2>
        <p className="mb-3 text-sm text-stone-600">
          Check that the money arrived in Zelle/Venmo with the reference shown, then approve. Approving starts the plan or ad immediately.
        </p>
        {pending.length === 0 && <p className="card text-stone-600">Nothing waiting.</p>}
        <ul className="space-y-3">
          {pending.map((p) => (
            <li key={p.id} className="card space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {p.vendor.businessName} · {formatUSD(p.amountCents)}
                  </p>
                  <p className="text-sm text-stone-600">
                    {describe(p)} · {metroName(p.vendor.metro)} · {p.vendor.phone}
                  </p>
                </div>
                <p className="text-sm text-stone-500">{fmtDate(p.createdAt)}</p>
              </div>
              <p className="rounded-md bg-stone-50 px-3 py-2 text-sm">
                {p.method}: <b className="font-mono">{p.reference}</b>
                {duplicateRefs.has(p.reference) && (
                  <span className="badge ml-2 bg-red-100 text-red-800">⚠ This transaction ID was used on another payment</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <form action={approve.bind(null, p.id)}>
                  <button className="btn">Approve</button>
                </form>
                <form action={reject.bind(null, p.id)} className="flex flex-1 gap-2">
                  <input name="note" className="input" placeholder="Reason (shown to seller)" required />
                  <button className="btn-outline text-red-700">Reject</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {heldReviews.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Ratings waiting for a check ({heldReviews.length})</h2>
          <p className="mb-3 text-sm text-stone-600">
            These looked risky, so they aren&apos;t public yet. Approve genuine ones, even if negative. Hide fakes: the seller rating themselves, one
            person using several accounts, or ratings given for a reward.
          </p>
          <ul className="space-y-2">
            {heldReviews.map((r) => (
              <li key={r.id} className="card space-y-2 py-3 text-sm">
                <p>
                  <b>{"★".repeat(r.rating)}</b> for {r.vendor.businessName} by {r.buyer.name} ({r.buyer.email}), account made{" "}
                  {fmtDate(r.buyer.createdAt)}
                  {r.verifiedContact && <span className="badge ml-2 bg-green-50 text-green-800">Contacted the seller</span>}
                </p>
                {r.comment && <p className="text-stone-600">{r.comment}</p>}
                <p className="text-xs font-medium text-amber-800">Held: {r.holdReason || "edited while waiting"}</p>
                <div className="flex gap-2">
                  <form action={setReviewVisibility.bind(null, r.id, true)}>
                    <button className="btn py-1.5 text-sm">Approve</button>
                  </form>
                  <form action={setReviewVisibility.bind(null, r.id, false)}>
                    <button className="btn-outline py-1.5 text-sm">Hide</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latestReviews.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Latest ratings</h2>
          <p className="mb-3 text-sm text-stone-600">
            Hide only fake, abusive or off-topic reviews. Removing honest negative reviews can break FTC rules on consumer reviews.
          </p>
          <ul className="space-y-2">
            {latestReviews.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="text-sm">
                  <p>
                    <b>{"★".repeat(r.rating)}</b> for {r.vendor.businessName} by {r.buyer.name} ({r.buyer.email})
                    {r.status === "HIDDEN" && <span className="badge ml-2 bg-stone-200 text-stone-700">Hidden</span>}
                  </p>
                  {r.comment && <p className="mt-1 text-stone-600">{r.comment}</p>}
                </div>
                <form action={setReviewVisibility.bind(null, r.id, r.status !== "VISIBLE")}>
                  <button className="btn-outline py-1.5 text-sm">{r.status === "VISIBLE" ? "Hide" : "Restore"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recently reviewed</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100 first:border-0">
                    <td className="px-4 py-2">{p.vendor.businessName}</td>
                    <td className="px-4 py-2">{p.purpose === "SUBSCRIPTION" ? "Plan" : "Featured ad"}</td>
                    <td className="px-4 py-2">{formatUSD(p.amountCents)}</td>
                    <td className="px-4 py-2">{p.status === "APPROVED" ? "Approved" : `Rejected: ${p.adminNote}`}</td>
                    <td className="px-4 py-2 text-stone-500">{p.reviewedAt && fmtDate(p.reviewedAt)}</td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
