"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getCurrentUser, requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { screenShortText } from "@/lib/moderation";
import { TOO_MANY, hit } from "@/lib/rate-limit";
import { checkReview, ipHash } from "@/lib/review-guard";

// New accounts wait a little before rating, which slows down throwaway-account review bombing.
const MIN_ACCOUNT_AGE_MS = 10 * 60_000;

// Only buyers with a verified email can rate, once per seller (re-submitting updates it).
export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const listingId = String(form.get("listingId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listing/${listingId}`);
  if (!user.emailVerifiedAt) redirect(`/verify?next=/listing/${listingId}`);
  if (Date.now() - user.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) {
    return { error: "New accounts can rate sellers 10 minutes after signing up." };
  }
  if (!(await hit("review", user.id))) return { error: TOO_MANY };

  const rating = Number(form.get("rating"));
  const comment = String(form.get("comment") ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose 1 to 5 stars." };
  const textProblem = comment && screenShortText(comment);
  if (textProblem) return { error: textProblem };
  if (form.get("honest") !== "on") return { error: "Please confirm this rating is based on your own experience." };

  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { vendorId: true, category: true, vendor: { select: { userId: true } } } });
  if (!listing) return { error: "This listing no longer exists." };
  // Buyers rate sellers; businesses (seller accounts) can also rate the creators who promoted them.
  if (user.role !== "BUYER" && !(user.role === "VENDOR" && listing.category === "CREATORS")) return { error: "Only buyer accounts can rate sellers." };
  if (listing.vendor.userId === user.id) return { error: "You can't rate your own business." };

  const existing = await db.review.findUnique({ where: { vendorId_buyerId: { vendorId: listing.vendorId, buyerId: user.id } } });
  const ip = await ipHash();
  const { verifiedContact, holdReason } = await checkReview({ vendorId: listing.vendorId, vendorUserId: listing.vendor.userId, buyer: user, comment, ip });
  // Risky ratings wait for an admin. One an admin hid stays hidden, and one waiting keeps waiting.
  const status = existing?.status === "HIDDEN" ? "HIDDEN" : holdReason || existing?.status === "PENDING" ? "PENDING" : "VISIBLE";
  const guard = { status, holdReason: holdReason || (status === "PENDING" ? existing?.holdReason ?? "" : ""), verifiedContact, ipHash: ip };
  await db.review.upsert({
    where: { vendorId_buyerId: { vendorId: listing.vendorId, buyerId: user.id } },
    create: { vendorId: listing.vendorId, buyerId: user.id, rating, comment, ...guard },
    // Editing a review clears the seller's reply, since it may no longer fit.
    update: { rating, comment, ...guard, ...(existing && existing.comment !== comment ? { vendorReply: "", vendorRepliedAt: null } : {}) },
  });
  revalidatePath(`/listing/${listingId}`);
  if (status === "PENDING") return { message: "Thanks! Your rating will appear after a quick check." };
  return { message: existing ? "Your rating is updated." : "Thanks! Your rating is posted." };
}

// Sellers can post one public reply per review.
export async function replyToReview(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const review = await db.review.findUnique({ where: { id: String(form.get("reviewId") ?? "") } });
  if (!review || review.vendorId !== vendor.id) return { error: "Review not found." };
  const reply = String(form.get("reply") ?? "").trim().slice(0, 1000);
  if (reply) {
    const problem = screenShortText(reply);
    if (problem) return { error: problem };
  }
  await db.review.update({ where: { id: review.id }, data: { vendorReply: reply, vendorRepliedAt: reply ? new Date() : null } });
  revalidatePath("/seller/[id]", "page");
  revalidatePath("/vendor/reviews");
  return { message: reply ? "Reply posted." : "Reply removed." };
}
