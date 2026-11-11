"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A top-bar link that marks itself as the current section (underline and aria-current).
export function NavLink({ href, match, className = "", children }: { href: string; match?: string; className?: string; children: React.ReactNode }) {
  const path = usePathname();
  const base = match ?? href.split("?")[0];
  const active = base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-md px-3 py-2 font-semibold text-ink/80 transition-colors duration-150 hover:text-forest after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-saffron after:transition-transform after:duration-200 hover:after:scale-x-100 aria-[current=page]:text-forest aria-[current=page]:after:scale-x-100 ${className}`}
    >
      {children}
    </Link>
  );
}
