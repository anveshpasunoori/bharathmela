import { Analytics } from "@vercel/analytics/next";
import { BottomNav } from "@/components/BottomNav";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { InstallApp } from "@/components/InstallApp";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { NavProgress } from "@/components/NavProgress";
import { DropdownCloser } from "@/components/DropdownCloser";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { PLATFORM_DISCLAIMER } from "@/lib/legal";
import { METROS } from "@/lib/metros";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl, cityPath, siteUrl } from "@/lib/seo";
import "./globals.css";

// Display serif for headings (see globals.css); a warm, crafted feel next to the clean body sans.
const display = Fraunces({ variable: "--font-display", subsets: ["latin"], display: "swap" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} – ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", title: `${SITE_NAME} – ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} – ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  // Google Search Console's "HTML tag" verification code, when set.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

// Who we are and how to search the site, for search engines (enables the sitelinks search box).
const SITE_JSON_LD = [
  { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: siteUrl(), logo: absoluteUrl("/icon.svg") },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    potentialAction: { "@type": "SearchAction", target: `${siteUrl()}/?q={search_term_string}`, "query-input": "required name=search_term_string" },
  },
];

export const viewport: Viewport = { themeColor: "#c2410c" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const savedCount = user ? await db.favorite.count({ where: { userId: user.id } }) : 0;
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className={`${geistSans.variable} ${display.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Suspense>
          <NavProgress />
        </Suspense>
        <SiteHeader user={user} savedCount={savedCount} lang={lang} />
        <DropdownCloser />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <BottomNav
          loggedIn={!!user}
          isSeller={!!user?.vendor}
          labels={{
            home: t(lang, "home"),
            events: t(lang, "events"),
            sell: t(lang, "sell"),
            postNeed: t(lang, "postNeedShort"),
            saved: t(lang, "saved"),
            dashboard: t(lang, "dashboard"),
            account: t(lang, "account"),
            logIn: t(lang, "logIn"),
          }}
        />
        {/* Page views and referrers (Vercel Web Analytics: no cookies, nothing personal). */}
        <Analytics />
        <footer className="border-t border-stone-200 bg-white print:hidden">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-4">
            <div className="sm:col-span-2">
              <p className="font-semibold text-brand">BharathMela</p>
              <p className="mt-1 text-stone-600">Home businesses from the Indian community, in your US city.</p>
              <InstallApp className="mt-3 block" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Buyers</p>
              <Link href="/" className="block text-stone-600 hover:text-brand">Browse</Link>
              <Link href="/events" className="block text-stone-600 hover:text-brand">Events</Link>
              <Link href="/safety" className="block text-stone-600 hover:text-brand">Safety tips</Link>
              <Link href="/signup" className="block text-stone-600 hover:text-brand">Create account</Link>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Sellers</p>
              <Link href="/vendor/signup" className="block text-stone-600 hover:text-brand">Start selling</Link>
              <Link href="/vendor/events/new" className="block text-stone-600 hover:text-brand">Post an event</Link>
              <Link href="/pricing" className="block text-stone-600 hover:text-brand">Pricing</Link>
              <Link href="/terms" className="block text-stone-600 hover:text-brand">Terms of Service</Link>
              <Link href="/privacy" className="block text-stone-600 hover:text-brand">Privacy Policy</Link>
            </div>
          </div>
          <nav className="mx-auto max-w-5xl border-t border-stone-100 px-4 py-5 text-sm" aria-label="Browse by city">
            <p className="mb-2 font-semibold">Browse by city</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-stone-600">
              {METROS.map((m) => (
                <li key={m.id}>
                  <Link href={cityPath(m.id)} className="hover:text-brand">{m.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Room for the phone tab bar under the last line. */}
          <p className="mx-auto max-w-5xl px-4 pb-24 text-xs text-stone-500 md:pb-6">{PLATFORM_DISCLAIMER}</p>
          <JsonLd data={SITE_JSON_LD} />
        </footer>
      </body>
    </html>
  );
}
