"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// A thin bar across the top while a page loads: from a tap on a link, or from filters and sorting that
// change the URL (useNavigate), until the new page is on screen. It stands alone in the layout (it
// doesn't wrap the page), so its own Suspense boundary can't hold the rest of the page back.
const START = "bm:navigating";

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (url: string) => {
      window.dispatchEvent(new Event(START));
      router.push(url, { scroll: false });
    },
    [router],
  );
}

export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  // The page a navigation started on; the bar shows until we're somewhere else.
  const [leaving, setLeaving] = useState<string | null>(null);
  const active = leaving === here;

  useEffect(() => {
    const current = () => `${location.pathname}?${location.search.slice(1)}`;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      setLeaving(current());
    };
    const onStart = () => setLeaving(current());
    document.addEventListener("click", onClick);
    window.addEventListener(START, onStart);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(START, onStart);
    };
  }, []);
  // Never leave a stuck bar (a cancelled or failed navigation).
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setLeaving(null), 12_000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-hidden={!active}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
    >
      <div className="h-full w-1/3 animate-[navbar_1.1s_ease-in-out_infinite] bg-brand" />
    </div>
  );
}
