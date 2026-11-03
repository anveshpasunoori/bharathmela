import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { DropdownCloser } from "@/components/DropdownCloser";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { PLATFORM_DISCLAIMER } from "@/lib/legal";
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
        <SiteHeader user={user} />
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
