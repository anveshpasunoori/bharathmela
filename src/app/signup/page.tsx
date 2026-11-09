import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { buyerSignup } from "../actions/auth";

export default async function BuyerSignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="mb-4 mt-1 text-stone-600">Free. Needed to rate sellers. We&apos;ll email you a code to confirm your address.</p>
      <div className="card">
        <ActionForm action={buyerSignup} submitLabel="Create account">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="name">Your name (shown on your ratings)</label>
            <input className="input" id="name" name="name" required autoComplete="name" />
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
              I agree to the <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link> and will only rate
              sellers I&apos;ve actually dealt with.
            </span>
          </label>
          <label className="flex gap-2 text-sm text-stone-700">
            <input type="checkbox" name="cityEmails" className="mt-0.5" />
            <span>Email me once a month with what&apos;s new in my city. You can stop anytime.</span>
          </label>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand">Log in</Link>
      </p>
    </div>
  );
}
