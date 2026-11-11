import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { NAV_GROUPS } from "@/lib/nav";
import { CategoryIcon } from "./CategoryIcon";
import { HeartIcon } from "./HeartIcon";
import { HeaderLocation } from "./HeaderLocation";
import { MobileMenu } from "./MobileMenu";
import { LanguagePicker } from "./LanguagePicker";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { type Lang, t } from "@/lib/i18n";

type HeaderUser = { name: string; email: string; role: string; vendor: unknown } | null;

const navLink = "rounded-md px-3 py-2 font-semibold text-ink/80 transition-colors duration-150 hover:bg-ivory hover:text-forest";
const dropLink = "flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2 font-semibold text-ink/80 transition-colors duration-150 hover:text-forest";

// The Explore menu: the main ways into the marketplace.
const EXPLORE = [
  { href: "/", label: "Home", blurb: "Popular categories, businesses and events near you" },
  { href: "/indian-classifieds", label: "Indian classifieds", blurb: "Every category in every BharathMela city" },
  { href: "/?category=ROOM_RENTAL", label: "Rooms & rentals", blurb: "Rooms, apartments and in-law units" },
  { href: "/rooms-wanted", label: "People looking for a place", blurb: "Renters describing what they need" },
  { href: "/creators", label: "Creators & influencers", blurb: "Promote your business with local creators" },
  { href: "/requests/new", label: "Post what you need", blurb: "Get quotes from local businesses" },
];

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 text-muted transition-transform duration-200 group-open:rotate-180" fill="currentColor">
      <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
    </svg>
  );
}
const menuLink = "block rounded-md px-3 py-2 hover:bg-stone-100";

// The top bar. Desktop shows the main sections as words, with categories grouped under Browse and the
// account behind its initial; phones get a slide-in menu with the same links.
export function SiteHeader({ user, savedCount = 0, unread = 0, lang = "en" }: { user: HeaderUser; savedCount?: number; unread?: number; lang?: Lang }) {
  const initial = (user?.name || user?.email || "?").trim()[0]?.toUpperCase();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md print:hidden">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2.5 text-sm sm:px-6 lg:px-8" aria-label="Main">
        <Link href="/" className="mr-3 shrink-0 lg:mr-8" aria-label="BharathMela home">
          <Logo />
        </Link>

        {/* Desktop sections */}
        <div className="hidden items-center gap-0.5 lg:flex">
          <details data-dropdown className="group relative">
            <summary className={`${dropLink} group-open:text-forest`}>
              Explore <Chevron />
            </summary>
            <div className="dropdown-panel absolute left-0 top-full z-30 mt-2 w-80 rounded-2xl border border-line bg-white p-2 shadow-xl">
              {EXPLORE.map((x) => (
                <Link key={x.href} href={x.href} className="block rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-ivory">
                  <span className="block font-semibold text-ink">{x.label}</span>
                  <span className="block text-xs text-muted">{x.blurb}</span>
                </Link>
              ))}
            </div>
          </details>
          <details data-dropdown className="group">
            <summary className={`${dropLink} group-open:text-forest`}>
              {t(lang, "categories")} <Chevron />
            </summary>
            <nav aria-label={t(lang, "categories")} className="dropdown-panel absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain border-y border-line bg-white shadow-xl">
              <div className="mx-auto grid max-w-7xl grid-cols-3 gap-4 px-6 py-5 xl:grid-cols-6 xl:px-8">
                {NAV_GROUPS.map((g) => (
                  <div key={g.title} className="rounded-xl border border-line bg-ivory/45 p-2">
                    <p className="mb-1 px-2 pt-1 text-xs font-semibold leading-tight text-forest xl:min-h-8">{g.title}</p>
                    <ul className="space-y-0.5">
                      {g.items.map((c) => (
                        <li key={c.id}>
                          <Link href={c.href} className="flex min-h-14 items-center gap-2 rounded-lg px-1.5 py-2 transition-colors hover:bg-white focus-visible:bg-white">
                            <CategoryIcon id={c.id} size={40} vector className="size-10 rounded-full" />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-tight text-ink">{c.label}</span>
                              <span className="mt-1 block text-xs leading-tight text-muted">{c.blurb}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-line bg-ivory">
                <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-1 px-8 py-3 text-sm">
                  <Link href="/requests/new" className="font-medium text-ink/80 hover:text-forest">Post what you need</Link>
                  <Link href="/rooms-wanted" className="text-muted hover:text-forest">People looking for a place</Link>
                  <Link href="/vendor/signup" className="ml-auto font-semibold text-saffron-dark">List your business free →</Link>
                </div>
              </div>
            </nav>
          </details>
          <NavLink href="/events">{t(lang, "events")}</NavLink>
          <NavLink href="/requests/new" match="/requests">{t(lang, "postRequest")}</NavLink>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {user?.vendor ? (
            <Link href="/vendor" className={`${navLink} hidden lg:block`}>My business</Link>
          ) : (
            <Link
              href="/vendor/signup"
              className="mr-1 hidden items-center gap-2 rounded-full bg-saffron px-4 py-2 font-semibold text-snow shadow-md shadow-saffron/25 transition duration-150 hover:-translate-y-px hover:bg-saffron-dark hover:shadow-lg sm:inline-flex"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h16l-1.5-5h-13zM5 10v9h14v-9M10 19v-5h4v5" />
              </svg>
              {t(lang, "listBusiness")}
            </Link>
          )}
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-line lg:block" />
          {user && (
            <Link href="/messages" className={`${navLink} relative flex items-center`} aria-label={unread ? `Messages (${unread} unread)` : "Messages"}>
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z" />
              </svg>
              {unread > 0 && (
                <span className="absolute -right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-snow">{unread}</span>
              )}
            </Link>
          )}
          {user && (
            <Link href="/saved" className={`${navLink} flex items-center gap-1.5`} aria-label={`Saved listings (${savedCount})`}>
              <HeartIcon filled={savedCount > 0} className="h-5 w-5" />
              <span className="hidden sm:inline">{t(lang, "saved")}</span>
              {savedCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-snow">{savedCount}</span>
              )}
            </Link>
          )}
          {user ? (
            <details data-dropdown className="relative hidden lg:block">
              <summary
                className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full bg-brand-soft font-semibold text-brand ring-1 ring-orange-200 hover:ring-brand"
                aria-label="Account menu"
              >
                {initial}
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                <div className="border-b border-stone-100 px-3 pb-2 pt-1">
                  <p className="truncate font-semibold">{user.name || "Your account"}</p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link href="/account" className={menuLink}>Account settings</Link>
                  <Link href="/saved" className={menuLink}>Saved listings</Link>
                  <Link href="/messages" className={menuLink}>Messages</Link>
                  <Link href="/requests" className={menuLink}>Requests &amp; quotes</Link>
                  <Link href="/rooms-wanted/mine" className={menuLink}>My room requests</Link>
                  {user.vendor ? (
                    <Link href="/vendor" className={menuLink}>My business</Link>
                  ) : (
                    <Link href="/vendor/signup" className={`${menuLink} font-semibold text-brand`}>Start selling</Link>
                  )}
                  {user.role === "ADMIN" && <Link href="/admin" className={menuLink}>Admin</Link>}
                </div>
                <form action={logout} className="border-t border-stone-100 pt-1">
                  <button className={`${menuLink} w-full text-left text-stone-500`}>Log out</button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/login" className={`${navLink} flex items-center gap-1.5`}>
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
              {t(lang, "logIn")}
            </Link>
          )}

          {/* Phones */}
          <MobileMenu>
            {user && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand">{initial}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{user.name || "Your account"}</span>
                  <span className="block truncate text-xs text-stone-500">{user.email}</span>
                </span>
              </div>
            )}
            {!user && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-outline">{t(lang, "logIn")}</Link>
                <Link href="/signup" className="btn">{t(lang, "signUp")}</Link>
              </div>
            )}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Browse</p>
            <div className="grid gap-2 min-[400px]:grid-cols-2">
              {NAV_GROUPS.flatMap((g) => g.items).map((c) => (
                <Link key={c.id} href={c.href} className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-ivory/45 p-2 text-sm font-medium hover:border-brand focus-visible:border-brand">
                  <CategoryIcon id={c.id} size={40} vector className="size-10 rounded-full" />
                  <span className="leading-tight">{c.label}</span>
                </Link>
              ))}
            </div>
            <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-stone-500">More</p>
            <div className="text-base">
              <Link href="/events" className={menuLink}>Events near you</Link>
              <Link href="/requests/new" className={menuLink}>Post what you need</Link>
              <Link href="/rooms-wanted" className={menuLink}>People looking for a place</Link>
              {user && (
                <>
                  <Link href="/saved" className={menuLink}>Saved listings</Link>
                  <Link href="/messages" className={menuLink}>Messages</Link>
                  <Link href="/requests" className={menuLink}>Requests &amp; quotes</Link>
                  <Link href="/rooms-wanted/mine" className={menuLink}>My room requests</Link>
                  <Link href="/account" className={menuLink}>Account settings</Link>
                </>
              )}
              {user?.role === "ADMIN" && <Link href="/admin" className={menuLink}>Admin</Link>}
              <Link href="/safety" className={menuLink}>Safety tips</Link>
            </div>
            <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Sellers</p>
            <div className="text-base">
              {user?.vendor ? (
                <Link href="/vendor" className={menuLink}>My business</Link>
              ) : (
                <Link href="/vendor/signup" className={`${menuLink} font-semibold text-brand`}>List your business free</Link>
              )}
              <Link href="/pricing" className={menuLink}>Pricing for sellers</Link>
            </div>
            {user && (
              <form action={logout} className="mt-5 border-t border-stone-100 pt-3">
                <button className={`${menuLink} w-full text-left text-base text-stone-500`}>Log out</button>
              </form>
            )}
          </MobileMenu>
        </div>
      </nav>
      {/* Location applies to the whole app, so it lives in the top bar. */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-2 sm:px-6 lg:px-8">
        <HeaderLocation />
        <LanguagePicker lang={lang} label={t(lang, "language")} />
      </div>
    </header>
  );
}
