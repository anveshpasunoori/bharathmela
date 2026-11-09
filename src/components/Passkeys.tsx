"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { passkeyLogin, passkeyLoginOptions, passkeyRegistrationOptions, savePasskey } from "@/app/actions/passkeys";

const noop = () => () => {};
// Only show passkey buttons in browsers that can use them (false while rendering on the server).
const useSupported = () => useSyncExternalStore(noop, browserSupportsWebAuthn, () => false);
// The person closed the browser's passkey prompt: not an error worth showing.
const cancelled = (e: unknown) => e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError");

const KeyIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-1.5A5.5 5.5 0 0 1 8.5 14H10" />
    <circle cx="17" cy="14" r="2.5" />
    <path d="M17 16.5V22l1.5-1.5L17 19" />
  </svg>
);

export function PasskeyLoginButton({ next = "/" }: { next?: string }) {
  const supported = useSupported();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!supported) return null;

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const start = await passkeyLoginOptions();
      if ("error" in start) return setError(start.error ?? "");
      const result = await passkeyLogin(await startAuthentication({ optionsJSON: start.options }), next);
      if ("error" in result) return setError(result.error ?? "");
      router.replace(result.redirect);
      router.refresh();
    } catch (e) {
      if (!cancelled(e)) setError("Your passkey couldn't be used. Try again, or log in with your email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2.5 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-60"
      >
        <KeyIcon />
        {busy ? "Waiting for your passkey…" : "Sign in with a passkey"}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function AddPasskeyButton() {
  const supported = useSupported();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  if (!supported) return <p className="text-sm text-stone-500">This browser can&apos;t make passkeys. Try Safari, Chrome or Edge on a recent phone or computer.</p>;

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const start = await passkeyRegistrationOptions();
      if ("error" in start) return setMessage({ ok: false, text: start.error ?? "" });
      const saved = await savePasskey(await startRegistration({ optionsJSON: start.options }));
      if ("error" in saved) return setMessage({ ok: false, text: saved.error ?? "" });
      setMessage({ ok: true, text: "Passkey added. Next time, choose “Sign in with a passkey” on the login page." });
      router.refresh();
    } catch (e) {
      if (e instanceof Error && e.name === "InvalidStateError") setMessage({ ok: false, text: "This device already has a passkey for your account." });
      else if (!cancelled(e)) setMessage({ ok: false, text: "The passkey couldn't be made. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={add} disabled={busy} className="btn inline-flex items-center gap-2 disabled:opacity-60">
        <KeyIcon />
        {busy ? "Follow your device's prompt…" : "Add a passkey"}
      </button>
      {message && <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}
