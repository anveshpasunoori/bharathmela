import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { login } from "../actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>
      <div className="card">
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
          Create an account to rate sellers
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
