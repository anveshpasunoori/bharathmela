import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requireVendor } from "@/lib/auth";
import { confirmPhone, sendPhoneVerification } from "../../actions/vendor";

export const metadata = { title: "Verify your phone", robots: { index: false } };

export default async function VerifyPhonePage() {
  const { user, vendor } = await requireVendor();
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <Link href="/vendor" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
      <div>
        <h1 className="text-2xl font-bold">Verify your phone</h1>
        <p className="mt-1 text-stone-600">
          Buyers see a <b>✓ Phone verified</b> badge on your listings, so they know the number really reaches you.
        </p>
      </div>
      {user.phoneVerifiedAt ? (
        <p className="card text-green-800">✓ {vendor.phone} is verified.</p>
      ) : (
        <>
          <div className="card space-y-3">
            <p className="text-sm">We&apos;ll text a code to <b>{vendor.phone}</b>. <Link href="/vendor/profile" className="text-brand underline">Wrong number?</Link></p>
            <ActionForm action={sendPhoneVerification} submitLabel="Text me a code" secondary className="space-y-2" />
          </div>
          <div className="card">
            <ActionForm action={confirmPhone} submitLabel="Verify">
              <div>
                <label className="label" htmlFor="code">Code from the text</label>
                <input className="input text-center font-mono text-lg tracking-widest" id="code" name="code" required
                  inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" />
              </div>
            </ActionForm>
          </div>
        </>
      )}
    </div>
  );
}
