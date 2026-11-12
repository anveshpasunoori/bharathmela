import { safeNextPath } from "@/lib/return-path";
import Link from "next/link";
import { SocialLogin } from "@/components/SocialLogin";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { CityZipFields } from "@/components/CityZipFields";
import { SellerKindFields } from "@/components/SellerSignupFields";
import { getCurrentUser } from "@/lib/auth";
import { becomeSeller, vendorSignup } from "../../actions/auth";

export const metadata = { title: "List your business", alternates: { canonical: "/vendor/signup" } };

// New sellers sign up here; people who already have an account (buyers) just add seller details.
// `kind=individual` and `next` come from links like "Having a garage sale? List it free".
export default async function VendorSignupPage({ searchParams }: { searchParams: Promise<{ kind?: string; next?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const kind = params.kind === "individual" ? "individual" : "business";
  const listingStart = "/vendor/listings/new";
  const next = safeNextPath(params.next, user?.vendor ? "/vendor" : listingStart);
  if (user?.vendor) redirect(next === "/vendor/signup" || next.startsWith("/vendor/signup?") ? "/vendor" : next);
  const onboardingQuery = new URLSearchParams({ kind, next });
  const onboardingPath = `/vendor/signup?${onboardingQuery}`;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">{kind === "individual" ? "List something on BharathMela" : "List your business"}</h1>
      <p className="mb-4 mt-1 text-stone-600">
        {user ? `Add a few details to your account, ${user.name.split(" ")[0]}, and you can post right away.` : "Your first listing is free."}
      </p>
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Set up your seller profile and verify your email. Then add a description, pricing if available, and photos to your first listing.
      </p>
      <div className="card space-y-3">
        {!user && <SocialLogin next={onboardingPath} label="Sign up" />}
        <ActionForm action={user ? becomeSeller : vendorSignup} submitLabel={user ? "Set up seller profile" : "Create seller account"}>
          <input type="hidden" name="next" value={next} />
          <SellerKindFields initialKind={kind} showName={!user} />
          <div>
            <label className="label" htmlFor="phone">Phone (shown to buyers)</label>
            <input className="input" id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(408) 555-0123" />
            <label className="mt-2 flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="whatsapp" /> Buyers can also message me on WhatsApp at this number
            </label>
          </div>
          <CityZipFields />
          {!user && (
            <>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password (8+ characters)</label>
                <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
              </div>
            </>
          )}
          <label className="flex gap-2 text-sm text-stone-700">
            <input type="checkbox" name="terms" required className="mt-0.5" />
            <span>
              I am 18 or older and agree to the{" "}
              <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link>. I understand I am an
              independent seller, responsible for my own listings, licenses, taxes and legal compliance.
            </span>
          </label>
          {!user && (
            <label className="flex gap-2 text-sm text-stone-700">
              <input type="checkbox" name="cityEmails" className="mt-0.5" />
              <span>Email me once a month with what&apos;s new in my city. You can stop anytime.</span>
            </label>
          )}
        </ActionForm>
        {!user && (
          <p className="mt-3 text-sm text-stone-600">
            Already have an account? <Link href={`/login?next=${encodeURIComponent(onboardingPath)}`} className="font-semibold text-brand">Log in</Link> to add selling to it.
          </p>
        )}
      </div>
    </div>
  );
}
