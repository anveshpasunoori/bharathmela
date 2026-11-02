"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Payments & reports", count: "queue" },
  { href: "/admin/listings", label: "Listings to review", count: "listings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/activity", label: "Activity log" },
] as const;

export function AdminNav({ counts }: { counts: { queue: number; listings: number } }) {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-stone-200">
      {TABS.map((t) => {
        const active = path === t.href;
        const n = "count" in t ? counts[t.count] : 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-brand text-brand" : "border-transparent text-stone-600 hover:text-stone-900"}`}
          >
            {t.label}
            {n > 0 && <span className="badge ml-1.5 bg-red-600 text-white">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
