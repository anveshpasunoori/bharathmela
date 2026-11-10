import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { ListingFields } from "@/components/ListingFields";
import { PhotoField } from "@/components/PhotoField";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan } from "@/lib/billing";
import { parseTags } from "@/lib/constants";
import { parseServiceTypes } from "@/lib/service-types";
import { readGarageSale } from "@/lib/garage-sales";
import { db } from "@/lib/db";
import { AI_WRITER_PLANS } from "@/lib/plans";
import { readCreator } from "@/lib/creators";
import { readEventService } from "@/lib/event-services";
import { readProfessional } from "@/lib/professionals";
import { readRental } from "@/lib/rentals";
import { updateListing } from "../../../../actions/vendor";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } } } });
  if (!listing || listing.vendorId !== vendor.id) notFound();
  const { plan } = await getVendorPlan(vendor.id);

  if (listing.status === "REMOVED") {
    return (
      <div className="card mx-auto max-w-lg">
        <h1 className="text-xl font-bold">This listing was removed</h1>
        <p className="mt-2 text-stone-600">Reason: {listing.moderationNote || "it broke our rules"}. Removed listings can&apos;t be edited.</p>
        <Link href="/vendor" className="btn mt-4">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Edit listing</h1>
      {listing.status === "REJECTED" && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Not approved: {listing.moderationNote}. Fix this and save to send it for review again.
        </p>
      )}
      <div className="card mt-4">
        <ActionForm action={updateListing} submitLabel="Save changes">
          <input type="hidden" name="listingId" value={listing.id} />
          <ListingFields
            canUseAI={AI_WRITER_PLANS.includes(plan.id)}
            initialRental={readRental(listing.details)}
            initialProfessional={readProfessional(listing.details)}
            initialEventService={readEventService(listing.details)}
            initialCreator={readCreator(listing.details)}
            initialGarageSale={readGarageSale(listing.details)}
            initial={{
              category: listing.category,
              title: listing.title,
              description: listing.description,
              price: listing.priceCents != null ? (listing.priceCents / 100).toFixed(2) : "",
              priceUnit: listing.priceUnit,
              tags: parseTags(listing.tags),
              types: parseServiceTypes(listing.category, listing.tags),
            }}
          />
          <PhotoField existing={listing.photos} />
          <label className="flex gap-2 text-sm text-stone-700">
            <input type="checkbox" name="confirm" required className="mt-0.5" />
            <span>
              I confirm this listing is accurate, legal, follows the rules above and the{" "}
              <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link>, and that I alone am responsible for it.
            </span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
