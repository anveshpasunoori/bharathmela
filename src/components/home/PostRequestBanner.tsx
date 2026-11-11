import Link from "next/link";
import Image from "next/image";
import { HOME_REQUEST_BANNER, HOME_REQUEST_SKYLINE } from "@/lib/home-art";
import { Reveal } from "./Reveal";

// "Can't find what you need?": opens the existing request form, where local sellers send quotes.
export function PostRequestBanner() {
  return (
    <Reveal as="div" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#d9e6cf] bg-gradient-to-r from-[#F1F6E8] via-[#F4F7EC] to-[#E6F0DA] px-6 py-8 sm:px-10 sm:py-9">
        {HOME_REQUEST_BANNER && (
          <Image src={HOME_REQUEST_BANNER} alt="" fill sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover object-right" />
        )}
        {!HOME_REQUEST_BANNER && (
          <Image src={HOME_REQUEST_SKYLINE} alt="" width={1200} height={260} className="pointer-events-none absolute bottom-0 right-0 h-auto w-[78%] max-w-3xl opacity-90 [mask-image:linear-gradient(to_right,transparent,black_30%)]" />
        )}
        {/* Temple skyline drawing, kept for when no skyline picture is set */}
        {!HOME_REQUEST_BANNER && !HOME_REQUEST_SKYLINE && <svg aria-hidden viewBox="0 0 520 140" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute bottom-0 right-0 h-full w-[70%] text-forest opacity-[0.09]">
          <path fill="currentColor" d="M0 140V118c40-6 70 2 110-4s60-10 90-6V96h10V70h8V52h6v-8h4v8h6v18h8v26h10v12c20 0 30-6 52-4V84h8V62h6V48h4v-8h4v8h4v14h6v22h8v24c30 0 50-10 80-8V92h6V74h6V64h4v10h6v18h6v16c30-4 60 4 90 0v32z" />
          <path fill="currentColor" d="M300 140v-20c8-14 22-18 34-12 6-10 20-12 28-2 10-6 24-2 26 10l10 24z" />
        </svg>}
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
          <span className="anim-float grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-[#d9e6cf]">
            <svg aria-hidden viewBox="0 0 48 48" className="h-12 w-12">
              <rect x="9" y="8" width="30" height="36" rx="4" fill="#FFF" stroke="#145638" strokeWidth="2.4" />
              <rect x="17" y="4" width="14" height="8" rx="2.5" fill="#F47721" />
              <path d="M15 20l2.5 2.5 4-4.5M15 29l2.5 2.5 4-4.5M15 38l2.5 2.5 4-4.5" fill="none" stroke="#F47721" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 21h9M25 30h9M25 39h6" stroke="#145638" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-forest-dark sm:text-[2rem]">Can&apos;t find what you need?</h2>
            <p className="mt-1.5 text-ink/75">Post a request and let local businesses contact you.</p>
          </div>
          <Link
            href="/requests/new"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-forest px-6 py-3 font-semibold text-snow shadow-lg shadow-forest/20 transition duration-150 hover:-translate-y-px hover:bg-forest-dark"
          >
            Post a request <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
