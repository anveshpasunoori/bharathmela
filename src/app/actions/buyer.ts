"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { publicListing } from "@/lib/listings";
import { TOO_MANY, hit } from "@/lib/rate-limit";

const DAY_MS = 86_400_000;
const MIN_ACCOUNT_AGE_MS = 10 * 60_000;

// Adds or removes a listing from the buyer's shortlist.
export async function toggleSaved(listingId: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listing/${listingId}`);
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

// Buyers message sellers through us: the seller gets an email with the buyer's address as reply-to,
// so buyers who'd rather not call can still ask a question.
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
  if (await db.message.findFirst({ where: { fromUserId: user.id, listingId, createdAt: { gt: new Date(Date.now() - DAY_MS) } } })) {
    return { error: "You've already messaged this seller about this listing today. Wait for their reply." };
  }

  await db.message.create({ data: { fromUserId: user.id, toUserId: listing.vendor.userId, listingId, body } });
  await sendEmail(
    listing.vendor.user.email,
    `New question about "${listing.title}" from ${user.name}`,
    `${user.name} asked about your BharathMela listing "${listing.title}":\n\n${body}\n\n` +
      `Reply to this email to answer ${user.name} directly.\n\n` +
      `Tip: confirm the price, date and details in writing before you start.`,
    user.email,
  );
  return { message: "Message sent. The seller will reply to your email." };
}
