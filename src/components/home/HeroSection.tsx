import Image from "next/image";
import Link from "next/link";
import type { FestivalCover } from "@/lib/festival-cover";
import { Parallax } from "./Parallax";
import { SmartSearch, type SearchLocation, type SearchSuggestion } from "./SmartSearch";

// The top of the home page: headline, search and the two main actions alongside storefront or seasonal photography.
// On phones the scene sits above the text as a banner; on wide screens it fills the right side.
export function HeroSection({
  suggestions,
  popular,
  locations,
  defaultLocation,
  exploreHref,
  festivalCover,
  everydayCover,
}: {
  suggestions: SearchSuggestion[];
  popular: SearchSuggestion[];
  locations: SearchLocation[];
  defaultLocation: string;
  exploreHref: string;
  festivalCover: FestivalCover | null;
  everydayCover: { src: string; alt: string };
}) {
  const cover = festivalCover ?? everydayCover;
  return (
    <section className="relative isolate overflow-hidden bg-ivory" aria-labelledby="home-hero">
      <div className="relative aspect-[3/2] max-h-48 overflow-hidden sm:max-h-80 [mask-image:linear-gradient(to_bottom,black_90%,transparent)] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:max-h-none lg:w-[58%] lg:max-w-[68rem] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
        <Parallax className="absolute inset-0">
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            preload
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-[64%_48%]"
          />
        </Parallax>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="max-w-xl lg:max-w-[37rem]">
          {festivalCover && <p className="mb-2 text-sm font-semibold text-forest">{festivalCover.festival}</p>}
          <h1 id="home-hero" className="anim-rise text-[2.4rem] font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-[3.15rem]">
            Find Indian businesses near you
          </h1>
          <div aria-hidden className="mt-5 h-0.5 w-20 rounded-full bg-saffron" />
          <p className="anim-rise mt-4 text-lg leading-relaxed text-ink/80 [animation-delay:90ms] sm:text-xl">
            Discover local home cooks, shops, tutors, and services.
          </p>
          <div className="anim-scale relative z-10 mt-7 [animation-delay:180ms] lg:w-[46rem] lg:max-w-[calc(100vw-4rem)]">
            <SmartSearch key={defaultLocation} suggestions={suggestions} popular={popular} locations={locations} defaultLocation={defaultLocation} />
          </div>
          <div className="anim-rise mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-forest [animation-delay:260ms]">
            <Link href={exploreHref} className="py-2 underline underline-offset-4 hover:text-forest-dark">
              Browse businesses <span aria-hidden>→</span>
            </Link>
            <Link href="/requests/new" className="py-2 underline underline-offset-4 hover:text-forest-dark">
              Post what you need <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
