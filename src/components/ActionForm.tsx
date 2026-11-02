"use client";

import { startTransition, useActionState } from "react";

export type FormState = { error?: string; message?: string } | undefined;

// Wraps a server action form and shows the error message it returns.
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
  secondary = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children?: React.ReactNode;
  className?: string;
  secondary?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // Submitting through a transition (instead of the form's action) stops React from
  // clearing the fields, so people don't retype everything after a validation error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }
  return (
    <form action={formAction} onSubmit={onSubmit} className={className}>
      {children}
      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{state.message}</p>}
      <button type="submit" className={`${secondary ? "btn-outline" : "btn"} w-full`} disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
