import Link from "next/link";
import { Reveal } from "./Reveal";

// "Can't find what you need?": opens the existing request form, where local sellers send quotes.
export function PostRequestBanner() {
  return (
    <Reveal as="div" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#d9e6cf] bg-gradient-to-r from-[#F1F6E8] via-[#F4F7EC] to-[#E6F0DA] px-6 py-8 sm:px-10 sm:py-9">
        <svg aria-hidden viewBox="0 0 520 140" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute bottom-0 right-0 h-full w-[70%] text-forest">
          <path d="M0 140c130-18 178-75 274-66 88 8 152 49 246-8v74z" fill="currentColor" opacity=".09" />
          <path d="M30 140c128-17 212-1 314-38 71-25 130-30 176-8v46z" fill="currentColor" opacity=".14" />
          <path d="M380 140q-18-28-15-66m4 32q-24-6-32-28 24 4 32 28m-3-14q19-8 26-30-22 9-26 30m87 48q6-29 1-53m1 25q18-5 26-24-20 4-26 24" fill="none" stroke="currentColor" strokeWidth="3" opacity=".19" />
        </svg>
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
