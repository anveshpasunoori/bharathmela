import Link from "next/link";
import type { ReactNode } from "react";
import { enabledProviders } from "@/lib/oauth";

// "Continue with Google / Apple" buttons, for the providers that are set up, with an "or" divider before
// the email form. Signing in this way also creates an account for someone new. The login page also passes
// its "Sign in with a passkey" button, shown with them.
export function SocialLogin({ next = "/", label = "Continue", passkey }: { next?: string; label?: string; passkey?: ReactNode }) {
  const providers = enabledProviders();
  if (!providers.length && !passkey) return null;
  const href = (p: string) => `/api/auth/${p}/start?next=${encodeURIComponent(next)}`;
  return (
    <div className="space-y-2">
      {providers.includes("google") && (
        <a href={href("google")} className="flex w-full items-center justify-center gap-2.5 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50">
          <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {label} with Google
        </a>
      )}
      {providers.includes("apple") && (
        <a href={href("apple")} className="flex w-full items-center justify-center gap-2.5 rounded-md bg-[#000] px-4 py-2.5 text-sm font-semibold text-[#fff] hover:opacity-90 dark:bg-[#fff] dark:text-[#000]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.17-1.53 2.65-.39 6.58 1.1 8.73.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.12.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.3-3.49zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z" />
          </svg>
          {label} with Apple
        </a>
      )}
      {passkey}
      <p className="text-center text-xs text-stone-500">
        By continuing you agree to the <Link href="/terms" className="underline">Terms of Service</Link>.
      </p>
      <div className="flex items-center gap-3 py-1 text-xs text-stone-400" aria-hidden>
        <span className="h-px flex-1 bg-stone-200" />
        or with email
        <span className="h-px flex-1 bg-stone-200" />
      </div>
    </div>
  );
}
