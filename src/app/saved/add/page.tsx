import { safeNextPath } from "@/lib/return-path";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";

export const metadata = { robots: { index: false } };

// Where tapping a heart while logged out leads after login: save the listing, then go back to the page
// the visitor was on. Saving twice is harmless, so this only ever adds.
export default async function SaveAfterLogin({ searchParams }: { searchParams: Promise<{ id?: string; back?: string }> }) {
  const { id = "", back: backParam = "/saved" } = await searchParams;
  const back = safeNextPath(backParam, "/saved");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/saved/add?id=${id}&back=${encodeURIComponent(back)}`)}`);
  if (/^[a-z0-9]+$/i.test(id) && (await db.listing.findFirst({ where: { id, ...publicListing() }, select: { id: true } }))) {
    await db.favorite.upsert({ where: { userId_listingId: { userId: user.id, listingId: id } }, create: { userId: user.id, listingId: id }, update: {} });
  }
  redirect(back);
}
