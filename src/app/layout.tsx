import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { DropdownCloser } from "@/components/DropdownCloser";
import { HeaderLocation } from "@/components/HeaderLocation";
import { getCurrentUser } from "@/lib/auth";
import { PLATFORM_DISCLAIMER } from "@/lib/legal";
import { logout } from "./actions/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BharathMela – Indian home businesses near you",
  description: "Find home kitchens, tutors, dance and music teachers, pujaris, artists and sellers from the Indian community in your US city.",
};

export const viewport: Viewport = { themeColor: "#c2410c" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5 text-sm" aria-label="Main">
            <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-brand">
              <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-white">BM</span>
              BharathMela
            </Link>
            <Link href="/events" className="hover:text-brand">Events</Link>
            {user && (
              <Link href="/saved" className="hover:text-brand" aria-label="Saved listings">
                ♡<span className="hidden sm:inline"> Saved</span>
              </Link>
            )}
            {!user && (
              <Link href="/login" className="btn-outline px-3 py-1.5">Log in</Link>
            )}
            {/* Everything else lives in a menu so the bar stays one line on phones. */}
            <details data-dropdown className="relative">
              <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-lg leading-none hover:bg-stone-100" aria-label="Menu">☰</summary>
              <div className="absolute right-0 z-30 mt-2 w-56 space-y-1 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                {user ? (
                  <>
                    <p className="truncate px-2 pb-1 text-xs text-stone-500">{user.name}</p>
                    <Link href="/account" className="block rounded px-2 py-1.5 hover:bg-stone-100">Account</Link>
                    <Link href="/saved" className="block rounded px-2 py-1.5 hover:bg-stone-100">Saved listings</Link>
                    <Link href="/rooms-wanted/mine" className="block rounded px-2 py-1.5 hover:bg-stone-100">My room requests</Link>
                    {user.vendor && <Link href="/vendor" className="block rounded px-2 py-1.5 hover:bg-stone-100">My business</Link>}
                    {user.role === "ADMIN" && <Link href="/admin" className="block rounded px-2 py-1.5 hover:bg-stone-100">Admin</Link>}
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block rounded px-2 py-1.5 hover:bg-stone-100">Log in</Link>
                    <Link href="/signup" className="block rounded px-2 py-1.5 hover:bg-stone-100">Create a free account</Link>
                  </>
                )}
                <hr className="my-1 border-stone-100" />
                <Link href="/events" className="block rounded px-2 py-1.5 hover:bg-stone-100">Events</Link>
                <Link href="/rooms-wanted" className="block rounded px-2 py-1.5 hover:bg-stone-100">People looking for rooms</Link>
                <Link href="/safety" className="block rounded px-2 py-1.5 hover:bg-stone-100">Safety tips</Link>
                <hr className="my-1 border-stone-100" />
                {!user?.vendor && <Link href="/vendor/signup" className="block rounded px-2 py-1.5 font-semibold text-brand hover:bg-stone-100">Sell on BharathMela</Link>}
                <Link href="/pricing" className="block rounded px-2 py-1.5 hover:bg-stone-100">Pricing for sellers</Link>
                {user && (
                  <form action={logout}>
                    <button className="block w-full rounded px-2 py-1.5 text-left text-stone-500 hover:bg-stone-100">Log out</button>
                  </form>
                )}
              </div>
            </details>
          </nav>
          {/* Location applies to the whole app, so it lives in the top bar. */}
          <div className="mx-auto max-w-5xl px-4 pb-2">
            <HeaderLocation />
          </div>
        </header>
        <DropdownCloser />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-4">
            <div className="sm:col-span-2">
              <p className="font-semibold text-brand">BharathMela</p>
              <p className="mt-1 text-stone-600">Home businesses from the Indian community, in your US city.</p>
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
          <p className="mx-auto max-w-5xl px-4 pb-6 text-xs text-stone-500">{PLATFORM_DISCLAIMER}</p>
        </footer>
      </body>
    </html>
  );
}
