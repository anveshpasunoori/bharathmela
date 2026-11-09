import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requestPasswordReset } from "../../actions/account";

export const metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">Forgot your password?</h1>
      <p className="mb-4 text-stone-600">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <div className="card">
        <ActionForm action={requestPasswordReset} submitLabel="Send reset link">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Remembered it? <Link href="/login" className="font-semibold text-brand">Log in</Link>
      </p>
    </div>
  );
}
