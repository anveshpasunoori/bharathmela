"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// The phone menu: ☰ opens a panel from the right over a dimmed page. It closes on the backdrop, the ✕
// button, Escape, or picking a link inside, and the page behind doesn't scroll while it's open.
// The panel is rendered into <body>: the header's backdrop blur would otherwise trap a fixed panel inside it.
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const opener = openRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={openRef}
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-md text-xl text-stone-700 hover:bg-stone-100"
        aria-label="Open menu"
        aria-expanded={open}
      >
        ☰
      </button>
      {onClient &&
        createPortal(
          <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
            <div
              className={`absolute inset-0 bg-stone-900/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              inert={!open}
              className={`absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
              onClick={(e) => {
                if ((e.target as Element).closest("a[href]")) setOpen(false);
              }}
            >
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <span className="font-bold text-brand">BharathMela</span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-md text-xl text-stone-500 hover:bg-stone-100"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const noSubscribe = () => () => {};
