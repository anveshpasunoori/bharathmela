"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { FormState } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { REPORT_REASONS, SELLER_HOLD_NOTE, reportReasonLabel } from "@/lib/legal";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { ipHash } from "@/lib/review-guard";
import { absoluteUrl } from "@/lib/seo";

// After this many different people report something, it's taken down until an admin looks at it.
const AUTO_HOLD_REPORTERS = 3;

type ReportForm = { reason: string; details: string; reporterEmail: string };

async function readForm(form: FormData): Promise<ReportForm | { error: string }> {
  if (!(await hit("report", await clientIp()))) return { error: TOO_MANY };
  const reason = String(form.get("reason") ?? "");
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "Choose a reason." };
  return {
    reason,
    details: String(form.get("details") ?? "").trim().slice(0, 2000),
    reporterEmail: String(form.get("email") ?? "").trim().slice(0, 200),
  };
}

// Signed-in reporters count once per account; others once per network.
async function reporterKey() {
  const user = await getCurrentUser();
  return user ? `u:${user.id}` : `ip:${await ipHash()}`;
}

async function distinctReporters(where: Prisma.ReportWhereInput) {
  const rows = await db.report.findMany({ where: { ...where, status: "OPEN" }, select: { reporterKey: true }, distinct: ["reporterKey"] });
  return rows.length;
}

// Tell the team right away about a seller or conversation report: these are the likely scams.
async function alertTeam(subject: string, lines: string[]) {
  const to = process.env.ALERT_EMAIL || process.env.SUPPORT_EMAIL;
  if (to) await sendEmail(to, subject, `${lines.join("\n")}\n\nReview it: ${absoluteUrl("/admin")}`);
}

// Anyone can report a listing, no account needed.
export async function reportListing(_: FormState, form: FormData): Promise<FormState> {
  const listingId = String(form.get("listingId") ?? "");
  const input = await readForm(form);
  if ("error" in input) return input;
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true, status: true } });
  if (!listing) return { error: "This listing no longer exists." };

  await db.report.create({ data: { listingId, ...input, reporterKey: await reporterKey() } });
  const reporters = await distinctReporters({ listingId });
  if (reporters >= AUTO_HOLD_REPORTERS && listing.status === "ACTIVE") {
    await db.listing.update({
      where: { id: listingId },
      data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${reporters} people reported it` },
    });
  }
  redirect(`/listing/${listingId}/report?sent=1`);
}

export async function reportEvent(_: FormState, form: FormData): Promise<FormState> {
  const eventId = String(form.get("eventId") ?? "");
  const input = await readForm(form);
  if ("error" in input) return input;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, status: true } });
  if (!event) return { error: "This event no longer exists." };

  await db.report.create({ data: { eventId, ...input, reporterKey: await reporterKey() } });
  const reporters = await distinctReporters({ eventId });
  if (reporters >= AUTO_HOLD_REPORTERS && event.status === "ACTIVE") {
    await db.event.update({
      where: { id: eventId },
      data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${reporters} people reported it` },
    });
  }
  redirect(`/events/${eventId}/report?sent=1`);
}

// A whole business: a fake business, impersonation, or a seller scamming people. When enough different
// people report the same seller, all their listings come down until an admin checks.
export async function reportSeller(_: FormState, form: FormData): Promise<FormState> {
  const vendorId = String(form.get("vendorId") ?? "");
  const input = await readForm(form);
  if ("error" in input) return input;
  const vendor = await db.vendorProfile.findUnique({ where: { id: vendorId }, select: { id: true, userId: true, businessName: true } });
  if (!vendor) return { error: "This business is no longer on BharathMela." };
  const key = await reporterKey();
  if (key === `u:${vendor.userId}`) return { error: "You can't report your own business." };

  await db.report.create({ data: { vendorId, ...input, reporterKey: key } });
  const reporters = await distinctReporters({ vendorId });
  let held = 0;
  if (reporters >= AUTO_HOLD_REPORTERS) {
    ({ count: held } = await db.listing.updateMany({ where: { vendorId, status: "ACTIVE" }, data: { status: "PENDING_REVIEW", moderationNote: SELLER_HOLD_NOTE } }));
  }
  await alertTeam(`Seller reported: ${vendor.businessName}`, [
    `${vendor.businessName} was reported for: ${reportReasonLabel(input.reason)}.`,
    input.details && `Details: ${input.details}`,
    `${reporters} ${reporters === 1 ? "person has" : "different people have"} reported this seller.`,
    held ? `${held} of their listings were taken down automatically until you check.` : "",
  ].filter(Boolean) as string[]);
  redirect(`/seller/${vendorId}/report?sent=1`);
}

// A conversation, reported by one of the two people in it (scam messages go both ways: fake sellers, and
// fake buyers sending overpayment checks).
export async function reportConversation(_: FormState, form: FormData): Promise<FormState> {
  const conversationId = String(form.get("conversationId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${conversationId}/report`);
  const input = await readForm(form);
  if ("error" in input) return input;
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, OR: [{ startedById: user.id }, { otherId: user.id }] },
    include: { startedBy: { select: { id: true, name: true } }, other: { select: { id: true, name: true } } },
  });
  if (!conversation) return { error: "Conversation not found." };
  const them = conversation.startedById === user.id ? conversation.other : conversation.startedBy;

  await db.report.create({ data: { conversationId, ...input, reporterKey: `u:${user.id}` } });
  await alertTeam(`Conversation reported: ${them.name}`, [
    `${user.name} reported a conversation with ${them.name} for: ${reportReasonLabel(input.reason)}.`,
    input.details && `Details: ${input.details}`,
  ].filter(Boolean) as string[]);
  redirect(`/messages/${conversationId}/report?sent=1`);
}
