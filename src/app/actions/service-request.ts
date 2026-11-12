"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { publicListing } from "@/lib/listings";
import { screenListing } from "@/lib/moderation";
import { REPORT_REASONS } from "@/lib/legal";
import { TOO_MANY, hit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/saved-searches";
import { MAX_OPEN_REQUESTS, REQUEST_DAYS, REQUEST_MIN_ACCOUNT_AGE_MS, notifyVendors, openRequest, parseRequestForm } from "@/lib/service-requests";

const DAY_MS = 86_400_000;

async function requireVerified(next: string) {
  const user = await requireUser(next);
  if (!user.emailVerifiedAt) redirect(`/verify?next=${encodeURIComponent(next)}`);
  return user;
}

export async function createRequest(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireVerified("/requests/new");
  if (Date.now() - user.createdAt.getTime() < REQUEST_MIN_ACCOUNT_AGE_MS) return { error: "New accounts can post 10 minutes after signing up." };
  const input = parseRequestForm(form);
  if ("error" in input) return input;
  // Same rules as listings. Requests go straight to sellers' inboxes, so anything flagged has to be
  // reworded rather than waiting for review.
  const screening = screenListing(`${input.title}\n${input.description}`, input.category);
  if (screening.block) return { error: screening.block };
  if (screening.flags.length) return { error: `Please reword your request: it mentions ${screening.flags.join(", ")}.` };
  if (!(await hit("listing", user.id))) return { error: TOO_MANY };
  const open = await db.serviceRequest.count({ where: { userId: user.id, ...openRequest() } });
  if (open >= MAX_OPEN_REQUESTS) return { error: `You can have ${MAX_OPEN_REQUESTS} open requests. Close one you no longer need first.` };

  const request = await db.serviceRequest.create({
    data: { userId: user.id, ...input, expiresAt: new Date(Date.now() + REQUEST_DAYS * DAY_MS) },
  });
  const notified = await notifyVendors(request);
  redirect(`/requests/${request.id}?posted=${notified}`);
}

// A seller's quote: saved once per request and emailed to the buyer, who replies to the seller directly.
export async function sendQuote(_: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "");
  const user = await requireVerified(`/requests/${id}`);
  const vendor = user.vendor;
  if (!vendor) return { error: "Only sellers can send quotes. Create a seller account to answer requests." };
  const request = await db.serviceRequest.findFirst({ where: { id, ...openRequest() }, include: { user: true } });
  if (!request) return { error: "This request is closed or has expired." };
  if (request.userId === user.id) return { error: "That's your own request." };
  const listing = await db.listing.findFirst({ where: { vendorId: vendor.id, category: request.category, ...publicListing() }, select: { id: true } });
  if (!listing) return { error: `Add a live listing in ${categoryLabel(request.category)} to quote on this request.` };

  const message = String(form.get("message") ?? "").trim();
  if (message.length < 20 || message.length > 1500) return { error: "Write a short message (20 to 1,500 characters): what you'd do, when you're free, and what's included." };
  const priceRaw = String(form.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  if (price != null && (!Number.isFinite(price) || price < 0 || price > 100_000)) return { error: "Price should be a number up to 100,000, or leave it empty." };
  const priceUnit = String(form.get("priceUnit") ?? "").trim().slice(0, 40);
  const screening = screenListing(message, request.category);
  if (screening.block) return { error: screening.block };
  if (screening.flags.some((f) => /wire|gift card|crypto|before viewing|upfront|advance/.test(f))) {
    return { error: "Quotes can't ask for wire transfers, gift cards, crypto or payment up front." };
  }
  if (!(await hit("message", user.id))) return { error: TOO_MANY };
  if (await db.quote.findUnique({ where: { requestId_vendorId: { requestId: id, vendorId: vendor.id } } })) {
    return { error: "You've already sent a quote for this request." };
  }

  const priceCents = price != null ? Math.round(price * 100) : null;
  await db.quote.create({ data: { requestId: id, vendorId: vendor.id, message, priceCents, priceUnit } });
  const priceLine = priceCents != null ? `Quote: $${(priceCents / 100).toLocaleString("en-US")}${priceUnit ? ` ${priceUnit}` : ""}\n` : "";
  await sendEmail(
    request.user.email,
    `${vendor.businessName} sent a quote – "${request.title}"`,
    `${vendor.businessName} answered your BharathMela request "${request.title}":\n\n${message}\n\n${priceLine}` +
      `See all quotes and the seller's reviews: ${appUrl()}/requests/${id}\n` +
      `Reply to this email to answer ${vendor.businessName} directly; your email stays private until you do.\n\n` +
      `Stay safe: check licenses and reviews, get the price and terms in writing, and never pay by wire, gift card or crypto.`,
    user.email,
  );
  revalidatePath(`/requests/${id}`);
  return { message: "Quote sent. They'll reply to your email if they're interested." };
}

async function ownRequest(id: string) {
  const user = await requireVerified("/requests");
  const request = await db.serviceRequest.findFirst({ where: { id, userId: user.id } });
  if (!request) throw new Error("Request not found");
  return request;
}

export async function closeRequest(id: string) {
  await ownRequest(id);
  await db.serviceRequest.update({ where: { id }, data: { status: "CLOSED" } });
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
}

export async function deleteRequest(id: string) {
  await ownRequest(id);
  await db.serviceRequest.delete({ where: { id } });
  revalidatePath("/requests");
  redirect("/requests?deleted=1");
}

// Sellers can report a request (spam, scams, abuse). Three open reports take it off sellers' lists until
// an admin reviews it.
export async function reportRequest(_: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "");
  const user = await requireVerified(`/requests/${id}`);
  if (!user.vendor) return { error: "Only sellers can report requests." };
  const reason = String(form.get("reason") ?? "");
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "Choose a reason." };
  if (!(await hit("report", user.id))) return { error: TOO_MANY };
  const request = await db.serviceRequest.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!request) return { error: "This request no longer exists." };
  if (await db.report.findFirst({ where: { serviceRequestId: id, reporterEmail: user.email, status: "OPEN" } })) {
    return { message: "You've already reported this request. Our team will review it." };
  }
  await db.report.create({
    data: { serviceRequestId: id, reason, details: String(form.get("details") ?? "").trim().slice(0, 2000), reporterEmail: user.email },
  });
  const open = await db.report.count({ where: { serviceRequestId: id, status: "OPEN" } });
  if (open >= 3 && request.status === "OPEN") {
    await db.serviceRequest.update({ where: { id }, data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${open} reports` } });
  }
  return { message: "Thanks. Our team will review this request." };
}
