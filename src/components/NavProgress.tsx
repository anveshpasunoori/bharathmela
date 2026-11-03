"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, useTransition } from "react";

// A thin bar across the top while a page loads: from a tap on a link, or from filters and sorting that
// change the URL (useNavigate), until the new page is on screen.
const NavContext = createContext<(url: string) => void>(() => {});
export const useNavigate = () => useContext(NavContext);

export function NavProgress({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  // The page a link was tapped on; the bar shows until we're somewhere else.
  const [leaving, setLeaving] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const clicked = leaving === here;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      setLeaving(`${location.pathname}?${location.search.slice(1)}`);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  // Never leave a stuck bar (a cancelled or failed navigation).
  useEffect(() => {
    if (!clicked) return;
    const t = setTimeout(() => setLeaving(null), 12_000);
    return () => clearTimeout(t);
  }, [clicked]);

  const navigate = useCallback((url: string) => start(() => router.push(url, { scroll: false })), [router]);
  const active = clicked || pending;
  return (
    <NavContext.Provider value={navigate}>
      <div
        role="progressbar"
        aria-label="Loading"
        aria-hidden={!active}
        className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
      >
        <div className="h-full w-1/3 animate-[navbar_1.1s_ease-in-out_infinite] bg-brand" />
      </div>
      {children}
    </NavContext.Provider>
  );
}
