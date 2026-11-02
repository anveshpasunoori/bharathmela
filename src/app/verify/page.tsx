import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { resendVerificationCode, verifyEmail } from "../actions/auth";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { next = "/" } = await searchParams;
  if (user.emailVerifiedAt) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-1 text-stone-600">
          We sent a 6-digit code to <b>{user.email}</b>.
        </p>
      </div>
      <div className="card">
        <ActionForm action={verifyEmail} submitLabel="Verify">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="code">Code</label>
            <input className="input text-center font-mono text-lg tracking-widest" id="code" name="code" required
              inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" />
          </div>
        </ActionForm>
      </div>
      <ActionForm action={resendVerificationCode} submitLabel="Send a new code" secondary className="space-y-2" />
    </div>
  );
}
