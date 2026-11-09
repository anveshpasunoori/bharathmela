"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The phone's tab bar: the five places people go most, always in reach of a thumb. Wider screens use the
// top bar instead.
type Labels = { home: string; events: string; sell: string; postNeed: string; saved: string; dashboard: string; account: string; logIn: string };

export function BottomNav({ loggedIn, isSeller, labels }: { loggedIn: boolean; isSeller: boolean; labels: Labels }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: labels.home, icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", match: (p: string) => p === "/" || p.startsWith("/in/") },
    { href: "/events", label: labels.events, icon: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", match: (p: string) => p.startsWith("/events") },
    {
      href: isSeller ? "/vendor/listings/new" : "/requests/new",
      label: isSeller ? labels.sell : labels.postNeed,
      icon: "M12 5v14M5 12h14",
      match: (p: string) => p.startsWith("/vendor/listings/new") || p.startsWith("/requests/new"),
      primary: true,
    },
    { href: "/saved", label: labels.saved, icon: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z", match: (p: string) => p.startsWith("/saved") },
    {
      href: loggedIn ? (isSeller ? "/vendor" : "/account") : "/login",
      label: loggedIn ? (isSeller ? labels.dashboard : labels.account) : labels.logIn,
      icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
      match: (p: string) => p.startsWith("/account") || p.startsWith("/login") || (p.startsWith("/vendor") && !p.startsWith("/vendor/listings/new")),
    },
  ];
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map((t) => {
          const on = t.match(path);
          return (
            <li key={t.label} className="flex-1">
              <Link href={t.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? "text-brand" : "text-stone-500"}`}>
                <span className={t.primary ? "grid h-8 w-8 place-items-center rounded-full bg-brand text-snow shadow-sm" : "grid h-6 w-6 place-items-center"}>
                  <svg aria-hidden viewBox="0 0 24 24" className={t.primary ? "h-5 w-5" : "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={t.primary ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={t.icon} />
                  </svg>
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
