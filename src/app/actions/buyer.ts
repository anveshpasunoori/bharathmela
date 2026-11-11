"use server";

import { safeNextPath } from "@/lib/return-path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOrStartConversation, postMessage } from "@/lib/conversations";
import { publicListing } from "@/lib/listings";
import { TOO_MANY, hit } from "@/lib/rate-limit";

const MIN_ACCOUNT_AGE_MS = 10 * 60_000;

// Adds or removes a listing from the buyer's shortlist. Logged-out visitors log in, and the save is
// finished on the way back to `back` (the page they tapped the heart on).
// (Used directly by the card hearts and as a bound form action, which passes form data instead.)
export async function toggleSaved(listingId: string, back?: string | FormData) {
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = safeNextPath(back, `/listing/${encodeURIComponent(listingId)}`);
    redirect(`/login?next=${encodeURIComponent(`/saved/add?id=${listingId}&back=${encodeURIComponent(returnTo)}`)}`);
  }
  const key = { userId_listingId: { userId: user.id, listingId } };
  if (await db.favorite.findUnique({ where: key })) {
    await db.favorite.delete({ where: key });
  } else {
    if (!(await db.listing.findFirst({ where: { id: listingId, ...publicListing() }, select: { id: true } }))) return;
    await db.favorite.create({ data: { userId: user.id, listingId } });
  }
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/saved");
}

// A buyer's first message to a seller about a listing starts (or continues) a conversation on BharathMela;
// the seller is emailed a link to it, and nobody's email address is shared.
export async function messageSeller(_: FormState, form: FormData): Promise<FormState> {
  const listingId = String(form.get("listingId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listing/${listingId}%23message`);
  if (!user.emailVerifiedAt) redirect(`/verify?next=/listing/${listingId}`);
  if (Date.now() - user.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) {
    return { error: "New accounts can send messages 10 minutes after signing up." };
  }
  const listing = await db.listing.findFirst({ where: { id: listingId, ...publicListing() }, include: { vendor: { include: { user: true } } } });
  if (!listing) return { error: "This listing is no longer available." };
  if (listing.vendor.userId === user.id) return { error: "That's your own listing." };
  const body = String(form.get("message") ?? "").trim();
  if (body.length < 10 || body.length > 2000) return { error: "Write a short message (10 to 2,000 characters)." };
  if (!(await hit("message", user.id))) return { error: TOO_MANY };
  const conversation = await findOrStartConversation(user.id, listing.vendor.userId, { listingId });
  await postMessage(conversation, user, body, listing.title);
  redirect(`/messages/${conversation.id}?sent=1`);
}
