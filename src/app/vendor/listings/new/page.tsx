import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { ListingFields } from "@/components/ListingFields";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan } from "@/lib/billing";
import { AI_WRITER_PLANS } from "@/lib/plans";
import { createListing } from "../../../actions/vendor";

export default async function NewListingPage() {
  const { vendor } = await requireVendor();
  const { plan } = await getVendorPlan(vendor.id);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">New listing</h1>
      <div className="card">
        <ActionForm action={createListing} submitLabel="Publish listing">
          <ListingFields canUseAI={AI_WRITER_PLANS.includes(plan.id)} />
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
