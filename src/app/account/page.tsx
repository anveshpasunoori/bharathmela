import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { changePassword, deleteAccount } from "../actions/auth";

export const metadata = { title: "Account – DesiBazaar" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="text-stone-600">
          {user.name} · {user.email}{" "}
          {user.emailVerifiedAt ? (
            <span className="text-sm text-green-700">✓ verified</span>
          ) : (
            <Link href="/verify?next=/account" className="text-sm font-semibold text-brand">Verify email</Link>
          )}
        </p>
        {user.vendor && (
          <Link href="/vendor" className="mt-2 inline-block text-sm font-semibold text-brand">Go to your seller dashboard →</Link>
        )}
      </div>

      <section className="card">
        <h2 className="mb-3 font-semibold">Change password</h2>
        <ActionForm action={changePassword} submitLabel="Change password">
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input className="input" id="current" name="current" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="password">New password (8+ characters)</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
        </ActionForm>
      </section>

      {user.role !== "ADMIN" && (
        <section className="card border-red-200">
          <h2 className="font-semibold text-red-800">Delete account</h2>
          <p className="mb-3 mt-1 text-sm text-stone-600">
            This removes your profile, listings and ratings right away and can&apos;t be undone. Records of payments you made to us are kept for
            accounting, without your name or email.
          </p>
          <ActionForm action={deleteAccount} submitLabel="Permanently delete my account" secondary>
            <div>
              <label className="label" htmlFor="del-password">Password</label>
              <input className="input" id="del-password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Type DELETE to confirm</label>
              <input className="input" id="confirm" name="confirm" required autoComplete="off" />
            </div>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
