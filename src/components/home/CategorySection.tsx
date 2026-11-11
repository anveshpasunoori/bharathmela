import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HOME_CATEGORY_PHOTOS } from "@/lib/home-art";
import { Reveal } from "./Reveal";
import { MobileViewAll, SectionHeading } from "./SectionHeading";

export const HOME_CATEGORIES = [
  { id: "FOOD", name: "Home Food & Produce" },
  { id: "TUTORING", name: "Classes & Tutors" },
  { id: "HOME_SERVICES", name: "Home Services" },
  { id: "EVENT_SERVICES", name: "Weddings & Events" },
  { id: "PUJARI", name: "Pujari & Religious Services" },
  { id: "ROOM_RENTAL", name: "Room Rentals" },
];

export function CategorySection({ hrefFor, allHref, counts }: { hrefFor: (id: string) => string; allHref: string; counts: Map<string, number> }) {
  return (
    <Reveal className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8" aria-labelledby="home-categories">
      <SectionHeading id="home-categories" icon="lotus" title="Explore popular categories" href={allHref} linkText="View all categories" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-6">
        {HOME_CATEGORIES.map((c) => {
          const photo = HOME_CATEGORY_PHOTOS[c.id];
          const n = counts.get(c.id) ?? 0;
          return (
            <li key={c.id} data-reveal-item>
              <Link
                href={hrefFor(c.id)}
                className="market-tile group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-soft"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
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
                <div className="relative flex flex-1 flex-col items-center justify-center bg-ivory px-3 py-3 text-center dark:bg-white">
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
