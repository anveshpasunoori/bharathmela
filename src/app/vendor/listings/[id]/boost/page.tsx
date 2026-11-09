import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PaymentFields } from "@/components/PaymentFields";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOSTS, formatUSD } from "@/lib/plans";
import { requestBoost } from "../../../../actions/vendor";
import { payBoostByCard } from "../../../../actions/stripe";
import { stripeEnabled } from "@/lib/stripe";

export default async function BoostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.vendorId !== vendor.id) notFound();

  const { days } = await searchParams;
  const option = BOOSTS.find((b) => String(b.days) === days) ?? BOOSTS[0];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Feature this listing</h1>
      <p className="mb-4 mt-1 text-stone-600">
        &ldquo;{listing.title}&rdquo; will be pinned to the top of its city and category with a Featured badge.
      </p>
      <div className="mb-4 flex gap-2">
        {BOOSTS.map((b) => (
          <a
            key={b.days}
            href={`?days=${b.days}`}
            className={b.days === option.days ? "btn" : "btn-outline"}
          >
            {b.days} days · {formatUSD(b.priceCents)}
          </a>
        ))}
      </div>
      {stripeEnabled() && listing.status === "ACTIVE" && (
        <div className="card space-y-2">
          <form action={payBoostByCard.bind(null, listing.id, option.days)}>
            <button className="btn w-full">Pay {formatUSD(option.priceCents)} by card, start now</button>
          </form>
          <p className="text-center text-xs text-stone-500">One-time payment. Secure checkout by Stripe.</p>
        </div>
      )}
      <details className="card mt-4" open={!stripeEnabled()}>
        <summary className="cursor-pointer font-semibold">{stripeEnabled() ? "Or pay by Zelle or Venmo" : "Pay by Zelle or Venmo"}</summary>
        <div className="mt-3">
          <ActionForm action={requestBoost} submitLabel="I've paid – submit for confirmation">
            <input type="hidden" name="listingId" value={listing.id} />
            <input type="hidden" name="days" value={option.days} />
            <PaymentFields amountCents={option.priceCents} />
          </ActionForm>
        </div>
      </details>
    </div>
  );
}
