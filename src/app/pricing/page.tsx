import Link from "next/link";
import { BOOSTS, PLANS, PLAN_PERIOD_DAYS, formatUSD } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pricing for sellers</h1>
        <p className="mt-1 text-stone-600">Buyers always browse free. Sellers pick a plan and can boost listings to the top.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <div key={plan.id} className={`card ${plan.id === "PRO" ? "border-brand ring-1 ring-brand/30" : ""}`}>
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-2xl font-bold">
              {plan.priceCents ? formatUSD(plan.priceCents) : "Free"}
              {plan.priceCents > 0 && <span className="text-sm font-normal text-stone-500"> / {PLAN_PERIOD_DAYS} days</span>}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-stone-700">
              {plan.perks.map((p) => (
                <li key={p}>✓ {p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Featured ads</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pin one listing to the top of your city and category, with a &ldquo;Featured&rdquo; badge.
        </p>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {BOOSTS.map((b) => (
            <li key={b.days} className="rounded-md bg-brand-soft px-3 py-2">
              <b>{formatUSD(b.priceCents)}</b> for {b.days} days
            </li>
          ))}
        </ul>
      </div>

      <Link href="/vendor/signup" className="btn">
        Start selling free
      </Link>
    </div>
  );
}
