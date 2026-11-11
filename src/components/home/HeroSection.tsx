import Image from "next/image";
import Link from "next/link";
import { HeroWave } from "./HeroScene";
import { Parallax } from "./Parallax";
import { SmartSearch, type SearchLocation, type SearchSuggestion } from "./SmartSearch";

// The top of the home page: headline, search and the two main actions over a backwater sunrise.
// On phones the scene sits above the text as a banner; on wide screens it fills the right side.
export function HeroSection({
  suggestions,
  popular,
  locations,
  defaultLocation,
  exploreHref,
}: {
  suggestions: SearchSuggestion[];
  popular: SearchSuggestion[];
  locations: SearchLocation[];
  defaultLocation: string;
  exploreHref: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#FFF8EC] via-[#FFF3E2] to-[#FDE7CC]" aria-labelledby="home-hero">
      <div className="relative aspect-[3/2] max-h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,black_86%,transparent)] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:max-h-none lg:w-[58%] lg:max-w-[68rem] lg:[mask-image:linear-gradient(to_right,transparent,black_24%)]">
        <Parallax className="absolute inset-0">
          <Image
            src="/home/dance-and-food-hero.webp"
            alt="A Bharatanatyam dancer beside a spread of Indian food on the Kerala backwaters"
            fill
            preload
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover object-[65%_56%]"
          />
        </Parallax>
      </div>

      {/* Floating marigold petals, purely decorative */}
      <span aria-hidden className="anim-float absolute left-[46%] top-16 hidden h-3 w-3 rounded-full bg-saffron/70 lg:block" />
      <span aria-hidden className="anim-float absolute left-[8%] top-[62%] hidden h-2 w-2 rounded-full bg-forest/40 [animation-delay:1.5s] lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8 lg:pb-24 lg:pt-16 2xl:min-h-[31rem]">
        <div className="max-w-xl lg:max-w-[37rem]">
          <h1 id="home-hero" className="anim-rise text-[2.4rem] font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-[3.15rem]">
            Discover the best of your <span className="relative whitespace-nowrap text-saffron">Indian</span> community.
          </h1>
          <p className="anim-rise mt-4 text-lg leading-relaxed text-ink/80 [animation-delay:90ms] sm:text-xl">
            Local businesses, homemade food, trusted services and community events — all in one place.
          </p>
          <svg aria-hidden viewBox="0 0 220 12" className="anim-rise mt-3 h-3 w-44 text-saffron [animation-delay:140ms]">
            <path d="M2 9C60 2 150 2 218 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="anim-scale relative z-10 mt-7 [animation-delay:180ms] lg:w-[46rem] lg:max-w-[calc(100vw-4rem)]">
            <SmartSearch suggestions={suggestions} popular={popular} locations={locations} defaultLocation={defaultLocation} />
          </div>
          <div className="anim-rise mt-5 flex flex-wrap gap-3 [animation-delay:260ms]">
            <Link
              href={exploreHref}
              className="group inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-snow shadow-md shadow-forest/20 transition duration-150 hover:-translate-y-px hover:bg-forest-dark"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M9 3h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v4H2V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zm0 3h6V5H9zM2 14h8v2h4v-2h8v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" /></svg>
              Explore businesses <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/requests/new"
              className="group inline-flex items-center gap-2 rounded-full border border-forest/30 bg-white/80 px-5 py-3 text-sm font-semibold text-forest backdrop-blur transition duration-150 hover:-translate-y-px hover:border-forest hover:bg-white"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5l4 4L8 20H4v-4z" /></svg>
              Post what you need <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>
      <HeroWave className="absolute inset-x-0 bottom-0 h-12 w-full sm:h-16 lg:h-20" />
    </section>
  );
}
