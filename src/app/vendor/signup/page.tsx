import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { METROS } from "@/lib/metros";
import { vendorSignup } from "../../actions/auth";

export default function VendorSignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Sell on BharathMela</h1>
      <p className="mb-4 mt-1 text-stone-600">Start free with one listing. Upgrade any time.</p>
      <div className="card">
        <ActionForm action={vendorSignup} submitLabel="Create seller account">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input className="input" id="name" name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="businessName">Business name</label>
            <input className="input" id="businessName" name="businessName" required placeholder="e.g. Lakshmi's Andhra Kitchen" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (shown to buyers)</label>
            <input className="input" id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(408) 555-0123" />
            <label className="mt-2 flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="whatsapp" /> Buyers can also message me on WhatsApp at this number
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label" htmlFor="metro">City</label>
              <select className="input" id="metro" name="metro" required defaultValue="">
                <option value="" disabled>Choose…</option>
                {METROS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}, {m.state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="zip">ZIP</label>
              <input className="input" id="zip" name="zip" inputMode="numeric" maxLength={5} required autoComplete="postal-code" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (8+ characters)</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          <label className="flex gap-2 text-sm text-stone-700">
            <input type="checkbox" name="terms" required className="mt-0.5" />
            <span>
              I am 18 or older and agree to the{" "}
              <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link>. I understand I am an
              independent seller, responsible for my own listings, licenses, taxes and legal compliance.
            </span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
