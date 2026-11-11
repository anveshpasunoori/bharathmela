import { photoBatchLimit } from "@/lib/photos";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { ListingFields } from "@/components/ListingFields";
import { PhotoField } from "@/components/PhotoField";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan } from "@/lib/billing";
import { CATEGORIES } from "@/lib/constants";
import { AI_WRITER_PLANS } from "@/lib/plans";
import { createListing } from "../../../actions/vendor";

export const metadata = { title: "New listing", robots: { index: false } };

// `?category=GARAGE_SALE` (from "List your garage sale" links) starts the form in that category.
export default async function NewListingPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { vendor } = await requireVendor();
  const { category } = await searchParams;
  const initialCategory = CATEGORIES.some((c) => c.id === category) ? category! : "";
  const { plan } = await getVendorPlan(vendor.id);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/vendor" className="text-sm font-medium text-forest hover:underline">← My business</Link>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Create a listing</h1>
      <p className="mb-5 mt-2 text-sm text-muted">
        Choose a category, describe what you offer, and add photos. Some listings go through review before they appear to buyers.
      </p>
      <div className="card">
        <ActionForm action={createListing} submitLabel="Submit listing">
          <ListingFields
            canUseAI={AI_WRITER_PLANS.includes(plan.id)}
            initial={initialCategory ? { category: initialCategory, title: "", description: "", price: "", priceUnit: "", tags: [] } : undefined}
          />
          <PhotoField batchLimit={photoBatchLimit} />
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
