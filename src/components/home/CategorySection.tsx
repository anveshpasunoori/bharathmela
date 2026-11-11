import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HOME_CATEGORY_PHOTOS } from "@/lib/home-art";
import { Reveal } from "./Reveal";
import { MobileViewAll, SectionHeading } from "./SectionHeading";

// The six categories on the home page, with the short name shown on the card and a line-icon badge.
export const HOME_CATEGORIES: { id: string; name: string; tint: string; badge: React.ReactNode }[] = [
  {
    id: "FOOD",
    name: "Homemade Food",
    tint: "from-[#FFE9D2] to-[#FFD3A8]",
    badge: <path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10" />,
  },
  {
    id: "TUTORING",
    name: "Classes & Tutors",
    tint: "from-[#E5F0FF] to-[#CFE1FB]",
    badge: <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6" />,
  },
  {
    id: "HOME_SERVICES",
    name: "Home Services",
    tint: "from-[#E6F2EA] to-[#CDE6D6]",
    badge: <path d="M14 6l4-4 4 4-4 4-3-1-8 8-2 3-3-3 3-2 8-8z" />,
  },
  {
    id: "EVENT_SERVICES",
    name: "Weddings & Events",
    tint: "from-[#FDE4EC] to-[#F9CEDC]",
    badge: (
      <>
        <circle cx="9" cy="14" r="5" />
        <circle cx="15" cy="14" r="5" />
        <path d="M10 5l2-2 2 2-2 2z" />
      </>
    ),
  },
  {
    id: "PUJARI",
    name: "Pujari & Religious Services",
    tint: "from-[#FFF1D0] to-[#FFE0A0]",
    badge: <path d="M12 3c-2 2.5-2 4.5 0 6 2-1.5 2-3.5 0-6zM5 13h14c0 4-3 7-7 7s-7-3-7-7zM9 20h6M12 9v4" />,
  },
  {
    id: "ROOM_RENTAL",
    name: "Room Rentals",
    tint: "from-[#E9EEF7] to-[#D5DEEE]",
    badge: <path d="M3 6v14m18-2v2M3 17h18v-5a2 2 0 0 0-2-2H9v7m-6-7h3a3 3 0 0 1 3 3" />,
  },
];

export function CategorySection({ hrefFor, allHref, counts }: { hrefFor: (id: string) => string; allHref: string; counts: Map<string, number> }) {
  return (
    <Reveal className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8" aria-labelledby="home-categories">
      <SectionHeading id="home-categories" icon="lotus" title="Explore popular categories" href={allHref} linkText="View all categories" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-6">
        {HOME_CATEGORIES.map((c) => {
          const photo = HOME_CATEGORY_PHOTOS[c.id];
          const n = counts.get(c.id) ?? 0;
          return (
            <li key={c.id} data-reveal-item>
              <Link
                href={hrefFor(c.id)}
                className="market-tile group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft"
              >
                <div className={`relative aspect-[3/2] overflow-hidden bg-gradient-to-br ${c.tint}`}>
                  {photo ? (
                    <Image src={photo} alt="" fill sizes="(min-width: 1280px) 220px, (min-width: 640px) 33vw, 50vw" className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.04]" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      {/* Soft rangoli rings behind the drawing */}
                      <svg aria-hidden viewBox="0 0 100 100" className="absolute h-[140%] w-[140%] text-white/60">
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 4" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                      </svg>
                      <CategoryIcon id={c.id} size={120} className="relative w-[58%] drop-shadow-md transition duration-500 group-hover:scale-110" />
                    </div>
                  )}
                </div>
                <div className="relative flex flex-1 flex-col items-center bg-[#fffbf3] px-3 pb-4 pt-6 text-center dark:bg-white">
                  <span className="absolute -top-5 grid size-10 place-items-center rounded-full border-2 border-white bg-[#fffbf3] text-forest-dark shadow-md transition-colors duration-300 group-hover:text-saffron-dark dark:bg-white dark:text-forest">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      {c.badge}
                    </svg>
                  </span>
                  <span className="text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-forest">{c.name}</span>
                  {n > 0 && <span className="mt-0.5 text-xs text-muted">{n} {n === 1 ? "listing" : "listings"}</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <MobileViewAll href={allHref}>View all categories</MobileViewAll>
    </Reveal>
  );
}
