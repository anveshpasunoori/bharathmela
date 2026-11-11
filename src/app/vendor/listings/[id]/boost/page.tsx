import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PaymentFields } from "@/components/PaymentFields";
import { requireVendor } from "@/lib/auth";
import { boostAvailability, localBoostDemand, TRIAL_BOOST_DAYS } from "@/lib/boost-offer";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { INTENT_WINDOW_DAYS } from "@/lib/market-intents";
import { metroName, metroTimeZone } from "@/lib/metros";
import { BOOSTS, formatUSD } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";
import { redeemBoostTrial } from "../../../../actions/boost";
import { requestBoost } from "../../../../actions/vendor";
import { payBoostByCard } from "../../../../actions/stripe";

export const metadata = { title: "Listing promotion", robots: { index: false } };

export default async function BoostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string; trial?: string; unavailable?: string }>;
}) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const listing = await db.listing.findFirst({
    where: { id, vendorId: vendor.id },
    include: { boosts: { include: { payment: { select: { amountCents: true, status: true } } }, orderBy: { createdAt: "desc" }, take: 8 } },
  });
  if (!listing) notFound();

  const { days, trial, unavailable } = await searchParams;
  const now = new Date();
  const option = BOOSTS.find((b) => String(b.days) === days) ?? BOOSTS[0];
  const [demand, pending, contactTaps] = await Promise.all([
    localBoostDemand(listing, now),
    db.adBoost.count({ where: { listingId: id, status: "PENDING" } }),
    db.lead.count({ where: { listingId: id, vendorId: vendor.id, createdAt: { gte: new Date(now.getTime() - 14 * 86_400_000) } } }),
  ]);
  const offer = boostAvailability(listing, option.days, demand, now);
  const canTry = !vendor.boostTrialUsedAt && !pending && (!listing.featuredUntil || listing.featuredUntil <= now)
    && !boostAvailability(listing, TRIAL_BOOST_DAYS, demand, now).reason;
  const manual = !!(process.env.PAY_ZELLE || process.env.PAY_VENMO);
  const card = stripeEnabled();
  const format = (date: Date) => date.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: metroTimeZone(listing.metro), timeZoneName: "short",
  });
  const recaps = await Promise.all(listing.boosts.map(async (boost) => ({
    ...boost,
    taps: boost.startsAt && boost.endsAt
      ? await db.lead.count({ where: { listingId: id, vendorId: vendor.id, createdAt: { gte: boost.startsAt, lt: boost.endsAt } } })
      : null,
  })));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/vendor" className="text-sm font-semibold text-forest hover:underline">← Your listings</Link>
      <header>
        <h1 className="text-3xl font-semibold text-ink">Worth boosting?</h1>
        <p className="mt-1 text-muted">{listing.title}</p>
      </header>
      {trial && <p role="status" className="card text-forest">Your free seven-day promotion is active.</p>}
      {unavailable && <p role="status" className="card text-amber-800">This offer changed before checkout. Review current availability below.</p>}
      <section className="card space-y-3" aria-labelledby="boost-demand">
        <h2 id="boost-demand" className="text-lg font-semibold">Demand in {metroName(listing.metro)}</h2>
        <p className="text-sm text-muted">{categoryLabel(listing.category)} · last {INTENT_WINDOW_DAYS} days</p>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div><dt>Category searches</dt><dd className="font-semibold">{demand ?? "Unavailable"}</dd></div>
          <div><dt>Listing views to date</dt><dd className="font-semibold">{listing.views}</dd></div>
          <div><dt>Contact taps in 14 days</dt><dd className="font-semibold">{contactTaps}</dd></div>
        </dl>
        <p className="text-sm text-muted">Category searches are a demand signal. Contact taps measure clicks to contact you. Sales are arranged directly with buyers.</p>
      </section>
      {canTry && (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Try a seven-day promotion free</h2>
          <p className="text-sm text-muted">One per seller. Your listing can rotate into a Sponsored slot in recommended browse results. The promotion ends automatically.</p>
          <ActionForm action={redeemBoostTrial.bind(null, id)} submitLabel="Start free promotion" />
        </section>
      )}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">One-time promotion</h2>
        <p className="text-sm text-muted">Your listing can rotate into a Sponsored slot when it matches the buyer’s category and location filters. You pay once. There’s no automatic renewal.</p>
        <div className="flex flex-wrap gap-2">
          {BOOSTS.map((b) => <Link key={b.days} href={`?days=${b.days}`} aria-current={b.days === option.days ? "true" : undefined} className={b.days === option.days ? "btn" : "btn-outline"}>{b.days} days · {formatUSD(b.priceCents)}</Link>)}
        </div>
        {pending > 0 ? <p className="text-sm text-muted">A payment for this listing is awaiting confirmation.</p>
          : offer.reason ? <p className="text-sm text-muted">{offer.reason}</p>
          : !card && !manual ? <p className="text-sm text-muted">Paid checkout is currently unavailable.</p>
          : (
            <>
              <p className="text-sm text-muted">Estimated dates if confirmed now: {format(offer.startsAt)} to {format(offer.endsAt)}.</p>
              {card && <form action={payBoostByCard.bind(null, id, option.days)}><button className="btn">Pay {formatUSD(option.priceCents)} by card</button></form>}
              {manual && (
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-forest">Pay by Zelle or Venmo</summary>
                  <div className="mt-3">
                    <ActionForm action={requestBoost} submitLabel="Submit payment for confirmation">
                      <input type="hidden" name="listingId" value={id} />
                      <input type="hidden" name="days" value={option.days} />
                      <PaymentFields amountCents={option.priceCents} />
                    </ActionForm>
                  </div>
                </details>
              )}
            </>
          )}
      </section>
      {recaps.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Promotion recaps</h2>
          <ul className="divide-y divide-line">
            {recaps.map((boost) => (
              <li key={boost.id} className="py-3 text-sm">
                <p className="font-semibold">{boost.days}-day promotion · {boost.payment ? formatUSD(boost.payment.amountCents) : "Free trial"}</p>
                <p className="text-muted">{boost.startsAt && boost.endsAt ? `${format(boost.startsAt)} to ${format(boost.endsAt)}` : boost.status === "PENDING" ? "Awaiting confirmation" : "Not scheduled"}</p>
                <p className="text-xs text-muted">Reference {boost.id}</p>
                {boost.startsAt && boost.startsAt <= now && (
                  <p>{boost.viewTrackingStartedAt ? `${boost.trackedViews} listing views` : "View tracking unavailable"} · {boost.taps ?? 0} contact taps during the promotion</p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">These are totals from the promotion window. If a paid placement was interrupted, <Link href="/contact?topic=Plans%20and%20payments" className="font-semibold text-forest underline">ask us to review the delivery</Link> and include the reference above.</p>
        </section>
      )}
    </div>
  );
}
