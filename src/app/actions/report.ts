"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { REPORT_REASONS } from "@/lib/legal";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";

// After this many open reports a live listing is taken down until an admin looks at it.
const AUTO_HOLD_REPORTS = 3;

// Anyone can report a listing, no account needed.
export async function reportListing(_: FormState, form: FormData): Promise<FormState> {
  const listingId = String(form.get("listingId") ?? "");
  const reason = String(form.get("reason") ?? "");
  const details = String(form.get("details") ?? "").trim().slice(0, 2000);
  const reporterEmail = String(form.get("email") ?? "").trim().slice(0, 200);

  if (!hit("report", await clientIp())) return { error: TOO_MANY };
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "Choose a reason." };
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true, status: true } });
  if (!listing) return { error: "This listing no longer exists." };

  await db.report.create({ data: { listingId, reason, details, reporterEmail } });
  const open = await db.report.count({ where: { listingId, status: "OPEN" } });
  if (open >= AUTO_HOLD_REPORTS && listing.status === "ACTIVE") {
    await db.listing.update({
      where: { id: listingId },
      data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${open} reports` },
    });
  }
  redirect(`/listing/${listingId}/report?sent=1`);
}

export async function reportEvent(_: FormState, form: FormData): Promise<FormState> {
  const eventId = String(form.get("eventId") ?? "");
  const reason = String(form.get("reason") ?? "");
  const details = String(form.get("details") ?? "").trim().slice(0, 2000);
  const reporterEmail = String(form.get("email") ?? "").trim().slice(0, 200);

  if (!hit("report", await clientIp())) return { error: TOO_MANY };
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "Choose a reason." };
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, status: true } });
  if (!event) return { error: "This event no longer exists." };

  await db.report.create({ data: { eventId, reason, details, reporterEmail } });
  const open = await db.report.count({ where: { eventId, status: "OPEN" } });
  if (open >= AUTO_HOLD_REPORTS && event.status === "ACTIVE") {
    await db.event.update({
      where: { id: eventId },
      data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${open} reports` },
    });
  }
  redirect(`/events/${eventId}/report?sent=1`);
}
