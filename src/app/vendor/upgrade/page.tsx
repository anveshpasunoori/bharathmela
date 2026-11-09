import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PaymentFields } from "@/components/PaymentFields";
import { requireVendor } from "@/lib/auth";
import { PLANS, PLAN_PERIOD_DAYS, formatUSD, isPaidPlan } from "@/lib/plans";
import { requestPlan } from "../../actions/vendor";
import { openBillingPortal, payPlanByCard } from "../../actions/stripe";
import { stripeEnabled } from "@/lib/stripe";

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { vendor } = await requireVendor();
  const card = stripeEnabled();
  const { plan: planId = "" } = await searchParams;
  if (!isPaidPlan(planId)) redirect("/pricing");
  const plan = PLANS[planId];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">{plan.name} plan</h1>
      <p className="mb-4 mt-1 text-stone-600">
        {formatUSD(plan.priceCents)} for {PLAN_PERIOD_DAYS} days · {plan.perks.join(" · ")}
      </p>
      {card && vendor.stripeSubscriptionId ? (
        <div className="card space-y-3">
          <p className="text-sm text-stone-700">You pay by card. Switch plans, update your card or cancel on the billing page.</p>
          <form action={openBillingPortal}>
            <button className="btn">Manage billing</button>
          </form>
        </div>
      ) : (
        card && (
          <div className="card space-y-2">
            <form action={payPlanByCard.bind(null, plan.id)}>
              <button className="btn w-full">Pay {formatUSD(plan.priceCents)}/month by card</button>
            </form>
            <p className="text-center text-xs text-stone-500">Renews every month. Cancel anytime. Secure checkout by Stripe.</p>
          </div>
        )
      )}
      <details className="card mt-4" open={!card}>
        <summary className="cursor-pointer font-semibold">{card ? "Or pay by Zelle or Venmo" : "Pay by Zelle or Venmo"}</summary>
        <div className="mt-3">
          <ActionForm action={requestPlan} submitLabel="I've paid – submit for confirmation">
            <input type="hidden" name="plan" value={plan.id} />
            <PaymentFields amountCents={plan.priceCents} />
          </ActionForm>
        </div>
      </details>
    </div>
  );
}
