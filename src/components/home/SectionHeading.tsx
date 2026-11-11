import Link from "next/link";

const ICONS = {
  lotus: (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M16 27c-3-3-5-7-5-12 0-3 2-7 5-10 3 3 5 7 5 10 0 5-2 9-5 12z" fill="#F47721" />
      <path d="M14 27c-5-1-9-4-11-9 4-1 8 1 10 4 1 1 1 3 1 5zM18 27c5-1 9-4 11-9-4-1-8 1-10 4-1 1-1 3-1 5z" fill="#F89A4E" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" fill="#F47721" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-forest" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeWidth={2.6} />
    </svg>
  ),
};

// A section title with its small icon, and a "View all →" link on the right.
export function SectionHeading({ id, icon, title, href, linkText }: { id: string; icon: keyof typeof ICONS; title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="flex items-center gap-3 text-2xl font-semibold text-ink sm:text-[1.9rem]">
        {ICONS[icon]}
        {title}
      </h2>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-dark sm:inline-flex">
          {linkText}
          <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}

// The same link under the section on phones, where the heading has no room for it.
export function MobileViewAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mt-5 flex items-center justify-center gap-1.5 rounded-full border border-line bg-white py-3 text-sm font-semibold text-forest sm:hidden">
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
