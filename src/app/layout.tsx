import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PLATFORM_DISCLAIMER } from "@/lib/legal";
import { logout } from "./actions/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DesiBazaar – Indian home businesses near you",
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
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm" aria-label="Main">
            <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold text-brand">
              <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-white">DB</span>
              DesiBazaar
            </Link>
            <Link href="/pricing" className="hover:text-brand">For sellers</Link>
            <Link href="/safety" className="hover:text-brand">Safety</Link>
            {user?.role === "ADMIN" && <Link href="/admin" className="hover:text-brand">Admin</Link>}
            {user?.vendor && <Link href="/vendor" className="hover:text-brand">My business</Link>}
            {user ? (
              <>
                <Link href="/account" className="hover:text-brand">Account</Link>
                <form action={logout}>
                  <button className="text-stone-500 hover:text-brand">Log out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-brand">Log in</Link>
                <Link href="/vendor/signup" className="btn py-1.5">Sell on DesiBazaar</Link>
              </>
            )}
          </nav>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-4">
            <div className="sm:col-span-2">
              <p className="font-semibold text-brand">DesiBazaar</p>
              <p className="mt-1 text-stone-600">Home businesses from the Indian community, in your US city.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Buyers</p>
              <Link href="/" className="block text-stone-600 hover:text-brand">Browse</Link>
              <Link href="/safety" className="block text-stone-600 hover:text-brand">Safety tips</Link>
              <Link href="/signup" className="block text-stone-600 hover:text-brand">Create account</Link>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Sellers</p>
              <Link href="/vendor/signup" className="block text-stone-600 hover:text-brand">Start selling</Link>
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
