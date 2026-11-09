"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { FormState } from "./ActionForm";

// The box at the bottom of a conversation: clears after sending, sends with Ctrl/⌘+Enter, and offers a few
// one-tap replies to sellers.
export function ReplyBox({ action, quickReplies = [] }: { action: (state: FormState, form: FormData) => Promise<FormState>; quickReplies?: string[] }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const box = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message === "sent" && box.current) box.current.value = "";
  }, [state]);
  const send = () => {
    if (!form.current || !box.current?.value.trim()) return;
    const data = new FormData(form.current);
    startTransition(() => formAction(data));
  };
  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="space-y-2"
    >
      {quickReplies.length > 0 && (
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              className="shrink-0 rounded-full bg-white px-3 py-1 text-sm text-stone-700 ring-1 ring-stone-300 hover:text-brand hover:ring-brand/50"
              onClick={() => {
                if (box.current) {
                  box.current.value = box.current.value ? `${box.current.value} ${q}` : q;
                  box.current.focus();
                }
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="reply" className="sr-only">Your message</label>
        <textarea
          ref={box}
          id="reply"
          name="body"
          rows={2}
          maxLength={2000}
          placeholder="Write a message…"
          className="input min-h-12 flex-1 resize-y"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className="btn shrink-0" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
