import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PaymentFields } from "@/components/PaymentFields";
import { requireVendor } from "@/lib/auth";
import { PLANS, PLAN_PERIOD_DAYS, formatUSD, isPaidPlan } from "@/lib/plans";
import { requestPlan } from "../../actions/vendor";

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  await requireVendor();
  const { plan: planId = "" } = await searchParams;
  if (!isPaidPlan(planId)) redirect("/pricing");
  const plan = PLANS[planId];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">{plan.name} plan</h1>
      <p className="mb-4 mt-1 text-stone-600">
        {formatUSD(plan.priceCents)} for {PLAN_PERIOD_DAYS} days · {plan.perks.join(" · ")}
      </p>
      <div className="card">
        <ActionForm action={requestPlan} submitLabel="I've paid – submit for confirmation">
          <input type="hidden" name="plan" value={plan.id} />
          <PaymentFields amountCents={plan.priceCents} />
        </ActionForm>
      </div>
    </div>
  );
}
