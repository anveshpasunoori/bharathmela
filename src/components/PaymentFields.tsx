import { PAYMENT_METHODS } from "@/lib/constants";
import { formatUSD } from "@/lib/plans";

// Manual payment step: the vendor pays us outside the app and tells us the reference.
// Replace with a Stripe Checkout redirect once payments are integrated.
export function PaymentFields({ amountCents }: { amountCents: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-brand-soft p-4 text-sm">
        <p className="font-semibold">
          Send {formatUSD(amountCents)} using one of these, then fill in the details below:
        </p>
        <ul className="mt-2 space-y-1">
          {process.env.PAY_ZELLE && <li>Zelle: <b>{process.env.PAY_ZELLE}</b></li>}
          {process.env.PAY_VENMO && <li>Venmo: <b>{process.env.PAY_VENMO}</b></li>}
        </ul>
        <p className="mt-2 text-stone-600">We confirm payments within 1 business day. Your plan or ad starts when it&apos;s confirmed.</p>
      </div>
      <div>
        <label className="label" htmlFor="method">Paid with</label>
        <select className="input" id="method" name="method" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="reference">Transaction ID or payment note</label>
        <input className="input" id="reference" name="reference" required placeholder="e.g. Zelle confirmation number" />
      </div>
    </div>
  );
}
