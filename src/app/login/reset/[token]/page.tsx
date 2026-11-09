import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { resetPassword } from "../../../actions/account";

export const metadata = { title: "Choose a new password", robots: { index: false } };

// From the emailed link. The token is checked when the form is sent, so an expired link still shows the
// form and then says to ask for a new one.
export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Choose a new password</h1>
      <div className="card">
        <ActionForm action={resetPassword} submitLabel="Save password and log in">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="label" htmlFor="password">New password (8+ characters)</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Link expired? <Link href="/login/forgot" className="font-semibold text-brand">Send a new one</Link>
      </p>
    </div>
  );
}
