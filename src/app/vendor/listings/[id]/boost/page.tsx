import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PaymentFields } from "@/components/PaymentFields";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOSTS, formatUSD } from "@/lib/plans";
import { requestBoost } from "../../../../actions/vendor";

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
      <div className="card">
        <ActionForm action={requestBoost} submitLabel="I've paid – submit for confirmation">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="days" value={option.days} />
          <PaymentFields amountCents={option.priceCents} />
        </ActionForm>
      </div>
    </div>
  );
}
