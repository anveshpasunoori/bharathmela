import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { changePassword, deleteAccount } from "../actions/auth";
import { updateCityEmails } from "../actions/city-emails";
import { cancelEmailChange, changeEmail, confirmEmailChange } from "../actions/account";
import { METROS, metroName } from "@/lib/metros";
import { AddPasskeyButton } from "@/components/Passkeys";
import { removePasskey } from "../actions/passkeys";
import { db } from "@/lib/db";

export const metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const user = await requireUser("/account");
  const { reset } = await searchParams;
  const passkeys = await db.passkey.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
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
        <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-brand">
          {user.vendor && <Link href="/vendor">Seller dashboard →</Link>}
          <Link href="/rooms-wanted/mine">My room requests →</Link>
        </div>
      </div>

      {reset && <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Your password is changed, and you&apos;re logged in.</p>}

      <section className="card">
        <h2 className="font-semibold">Email address</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">
          You sign in with <b>{user.email}</b>. To change it, we&apos;ll send a code to the new address.
        </p>
        {user.pendingEmail ? (
          <div className="space-y-3">
            <ActionForm action={confirmEmailChange} submitLabel="Confirm new email">
              <div>
                <label className="label" htmlFor="code">Code sent to {user.pendingEmail}</label>
                <input className="input font-mono tracking-widest" id="code" name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" />
              </div>
            </ActionForm>
            <form action={cancelEmailChange}>
              <button className="text-sm font-medium text-stone-500 hover:text-brand">Cancel the change</button>
            </form>
          </div>
        ) : (
          <ActionForm action={changeEmail} submitLabel="Send code">
            <div>
              <label className="label" htmlFor="new-email">New email</label>
              <input className="input" id="new-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="email-password">Your password</label>
              <input className="input" id="email-password" name="password" type="password" required autoComplete="current-password" />
            </div>
          </ActionForm>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold">Monthly city email</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">New listings and upcoming events in your city, on the 1st of each month. Nothing else.</p>
        <ActionForm action={updateCityEmails} submitLabel="Save">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="cityEmails" defaultChecked={user.cityEmails} />
            Send me the monthly email
          </label>
          <div>
            <label className="label" htmlFor="metro">City</label>
            <select id="metro" name="metro" className="input" defaultValue={user.cityEmailMetro ?? user.vendor?.metro ?? ""}>
              <option value="">Choose your city</option>
              {METROS.map((m) => (
                <option key={m.id} value={m.id}>{metroName(m.id)}</option>
              ))}
            </select>
          </div>
        </ActionForm>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">Passkeys</h2>
          <p className="mt-1 text-sm text-stone-600">
            Sign in with Face ID, Touch ID, Windows Hello or your phone&apos;s screen lock instead of a password. Your fingerprint or face never
            leaves your device.
          </p>
        </div>
        {passkeys.length > 0 && (
          <ul className="divide-y divide-stone-100 rounded-md ring-1 ring-stone-200">
            {passkeys.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-stone-800">{p.name || "Passkey"}</span>
                  <span className="block text-xs text-stone-500">
                    Added {p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {p.lastUsedAt ? ` · last used ${p.lastUsedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : " · not used yet"}
                  </span>
                </span>
                <form action={removePasskey.bind(null, p.id)}>
                  <button className="text-xs font-semibold text-red-700 hover:underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AddPasskeyButton />
      </section>

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
