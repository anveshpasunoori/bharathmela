import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { PasskeyLoginButton } from "@/components/Passkeys";
import { SocialLogin } from "@/components/SocialLogin";
import { safeNextPath } from "@/lib/return-path";
import { login } from "../actions/auth";

const PROVIDER_ERRORS: Record<string, string> = {
  oauth: "That sign-in didn't go through. Please try again.",
  unverified: "That account's email isn't verified with the provider. Try another way to sign in.",
  suspended: "This account has been suspended. Contact support if you think this is a mistake.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: requestedNext, error } = await searchParams;
  const next = safeNextPath(requestedNext);
  const destination = next.split(/[?#]/, 1)[0];
  const posting = destination === "/requests/new" || destination === "/rooms-wanted/new";
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">{posting ? "Log in to post what you need" : "Log in"}</h1>
      {posting && (
        <p className="mb-4 text-sm text-muted">
          Posting is free. After you sign in and verify your email, you can describe what you need and receive replies.
        </p>
      )}
      {error && PROVIDER_ERRORS[error] && <p className="mb-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{PROVIDER_ERRORS[error]}</p>}
      <div className="card space-y-3">
        <SocialLogin next={next} passkey={<PasskeyLoginButton next={next} />} />
        <ActionForm action={login} submitLabel="Log in">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
            <Link href="/login/forgot" className="mt-1 inline-block text-sm font-medium text-brand">Forgot password?</Link>
          </div>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand">
          Create a free account
        </Link>
        <br />
        Selling something?{" "}
        <Link href="/vendor/signup" className="font-semibold text-brand">
          Create a seller account
        </Link>
      </p>
    </div>
  );
}
