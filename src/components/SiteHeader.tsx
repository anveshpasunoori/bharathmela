import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { NAV_GROUPS } from "@/lib/nav";
import { CategoryIcon } from "./CategoryIcon";
import { HeartIcon } from "./HeartIcon";
import { HeaderLocation } from "./HeaderLocation";
import { MobileMenu } from "./MobileMenu";
import { LanguagePicker } from "./LanguagePicker";
import { type Lang, t } from "@/lib/i18n";

type HeaderUser = { name: string; email: string; role: string; vendor: unknown } | null;

const navLink = "rounded-md px-3 py-2 font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900";
const menuLink = "block rounded-md px-3 py-2 hover:bg-stone-100";

// The top bar. Desktop shows the main sections as words, with categories grouped under Browse and the
// account behind its initial; phones get a slide-in menu with the same links.
export function SiteHeader({ user, savedCount = 0, lang = "en" }: { user: HeaderUser; savedCount?: number; lang?: Lang }) {
  const initial = (user?.name || user?.email || "?").trim()[0]?.toUpperCase();
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2 text-sm" aria-label="Main">
        <Link href="/" className="mr-4 flex items-center gap-2 text-lg font-bold text-brand">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-snow">BM</span>
          BharathMela
        </Link>

        {/* Desktop sections */}
        <div className="hidden items-center gap-1 md:flex">
          <details data-dropdown className="group">
            <summary className={`${navLink} flex cursor-pointer list-none items-center gap-1 group-open:bg-stone-100 group-open:text-stone-900`}>
              {t(lang, "browse")} <span aria-hidden className="text-xs text-stone-500 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="absolute inset-x-0 top-full z-30 border-y border-stone-200 bg-white shadow-lg">
              <div className="mx-auto grid max-w-5xl grid-cols-3 gap-x-6 gap-y-5 px-4 py-6 lg:grid-cols-5">
                {NAV_GROUPS.map((g) => (
                  <div key={g.title}>
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{g.title}</p>
                    <ul className="space-y-0.5">
                      {g.items.map((c) => (
                        <li key={c.id}>
                          <Link href={c.href} className="flex gap-2 rounded-md px-2 py-1.5 hover:bg-stone-50">
                            <CategoryIcon id={c.id} size={36} className="h-9 w-9" />
                            <span>
                              <span className="block font-medium text-stone-800">{c.label}</span>
                              <span className="block text-xs text-stone-500">{c.blurb}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 bg-stone-50">
                <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-1 px-6 py-3 text-sm">
                  <Link href="/" className="font-medium text-stone-700 hover:text-brand">All categories</Link>
                  <Link href="/requests/new" className="font-medium text-stone-700 hover:text-brand">Post what you need</Link>
                  <Link href="/rooms-wanted" className="text-stone-600 hover:text-brand">People looking for a place</Link>
                  <Link href="/events" className="text-stone-600 hover:text-brand">Events near you</Link>
                  <Link href="/vendor/signup" className="ml-auto font-semibold text-brand">List your business free →</Link>
                </div>
              </div>
            </div>
          </details>
          <Link href="/?category=ROOM_RENTAL" className={navLink}>{t(lang, "rooms")}</Link>
          <Link href="/events" className={navLink}>{t(lang, "events")}</Link>
          {user?.vendor ? (
            <Link href="/vendor" className={navLink}>My business</Link>
          ) : (
            <Link href="/vendor/signup" className="ml-1 rounded-full px-3.5 py-1.5 font-semibold text-brand ring-1 ring-brand hover:bg-brand-soft">
              {t(lang, "listBusiness")}
            </Link>
          )}
          <Link href="/requests/new" className="rounded-md px-3 py-2 font-semibold text-brand hover:bg-brand-soft">{t(lang, "postNeed")}</Link>
        </div>

        <div className="ml-auto flex items-center gap-1">
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
            <details data-dropdown className="relative hidden md:block">
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
            <>
              <Link href="/login" className={navLink}>{t(lang, "logIn")}</Link>
              <Link href="/signup" className="btn hidden px-3 py-1.5 md:inline-flex">{t(lang, "signUp")}</Link>
            </>
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
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_GROUPS.flatMap((g) => g.items).map((c) => (
                <Link key={c.id} href={c.href} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-stone-100">
                  <CategoryIcon id={c.id} size={32} className="h-8 w-8" />
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pb-2">
        <HeaderLocation />
        <LanguagePicker lang={lang} label={t(lang, "language")} />
      </div>
    </header>
  );
}
