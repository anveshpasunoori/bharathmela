"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { approvePayment, rejectPayment } from "@/lib/billing";
import { db } from "@/lib/db";
import { rewardReferrer } from "@/lib/growth";

const note = (form: FormData) => String(form.get("note") ?? "").trim().slice(0, 500);

export async function approve(paymentId: string) {
  const admin = await requireAdmin();
  await approvePayment(paymentId, admin.id);
  await audit(admin.id, "payment.approve", "payment", paymentId);
  revalidatePath("/admin");
}

export async function reject(paymentId: string, form: FormData) {
  const admin = await requireAdmin();
  await rejectPayment(paymentId, admin.id, note(form));
  await audit(admin.id, "payment.reject", "payment", paymentId, note(form));
  revalidatePath("/admin");
}

// Removing a reported listing or event closes every open report on it. Sellers can't restore removed items.
export async function resolveReport(reportId: string, remove: boolean, form: FormData) {
  const admin = await requireAdmin();
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) return;
  const now = new Date();
  if (remove) {
    const reason = note(form) || "reported and found to break our rules";
    const removed = { status: "REMOVED", moderationNote: reason };
    const closeReports = { status: "ACTIONED", resolvedAt: now };
    if (report.listingId) {
      await db.$transaction([
        db.listing.update({ where: { id: report.listingId }, data: removed }),
        db.report.updateMany({ where: { listingId: report.listingId, status: "OPEN" }, data: closeReports }),
      ]);
      await audit(admin.id, "listing.remove", "listing", report.listingId, reason);
    } else if (report.eventId) {
      await db.$transaction([
        db.event.update({ where: { id: report.eventId }, data: removed }),
        db.report.updateMany({ where: { eventId: report.eventId, status: "OPEN" }, data: closeReports }),
      ]);
      await audit(admin.id, "event.remove", "event", report.eventId, reason);
    } else if (report.roomWantedId) {
      await db.$transaction([
        db.roomWanted.update({ where: { id: report.roomWantedId }, data: removed }),
        db.report.updateMany({ where: { roomWantedId: report.roomWantedId, status: "OPEN" }, data: closeReports }),
      ]);
      await audit(admin.id, "roomWanted.remove", "roomWanted", report.roomWantedId, reason);
    } else if (report.serviceRequestId) {
      await db.$transaction([
        db.serviceRequest.update({ where: { id: report.serviceRequestId }, data: removed }),
        db.report.updateMany({ where: { serviceRequestId: report.serviceRequestId, status: "OPEN" }, data: closeReports }),
      ]);
      await audit(admin.id, "serviceRequest.remove", "serviceRequest", report.serviceRequestId, reason);
    }
  } else {
    await db.report.update({ where: { id: reportId }, data: { status: "DISMISSED", resolvedAt: now } });
    await audit(admin.id, "report.dismiss", "report", reportId);
    // A request held after reports goes back up once no reports on it are left open.
    if (report.serviceRequestId && !(await db.report.count({ where: { serviceRequestId: report.serviceRequestId, status: "OPEN" } }))) {
      await db.serviceRequest.updateMany({ where: { id: report.serviceRequestId, status: "PENDING_REVIEW" }, data: { status: "OPEN", moderationNote: "" } });
    }
  }
  revalidatePath("/admin");
}

export async function approveEvent(eventId: string) {
  const admin = await requireAdmin();
  await db.event.update({ where: { id: eventId }, data: { status: "ACTIVE", moderationNote: "" } });
  await audit(admin.id, "event.approve", "event", eventId);
  revalidatePath("/admin/listings");
}

export async function rejectEvent(eventId: string, form: FormData) {
  const admin = await requireAdmin();
  const reason = note(form) || "doesn't meet our event rules";
  await db.event.update({ where: { id: eventId }, data: { status: "REJECTED", moderationNote: reason } });
  await audit(admin.id, "event.reject", "event", eventId, reason);
  revalidatePath("/admin/listings");
}

export async function approveWanted(id: string) {
  const admin = await requireAdmin();
  await db.roomWanted.update({ where: { id }, data: { status: "ACTIVE", moderationNote: "" } });
  await audit(admin.id, "roomWanted.approve", "roomWanted", id);
  revalidatePath("/admin/listings");
}

export async function rejectWanted(id: string, form: FormData) {
  const admin = await requireAdmin();
  const reason = note(form) || "doesn't meet our rules";
  await db.roomWanted.update({ where: { id }, data: { status: "REJECTED", moderationNote: reason } });
  await audit(admin.id, "roomWanted.reject", "roomWanted", id, reason);
  revalidatePath("/admin/listings");
}

export async function approveListing(listingId: string) {
  const admin = await requireAdmin();
  const listing = await db.listing.update({ where: { id: listingId }, data: { status: "ACTIVE", moderationNote: "" } });
  await audit(admin.id, "listing.approve", "listing", listingId);
  await rewardReferrer(listing.vendorId);
  revalidatePath("/admin/listings");
}

export async function rejectListing(listingId: string, form: FormData) {
  const admin = await requireAdmin();
  const reason = note(form) || "doesn't meet our listing rules";
  await db.listing.update({ where: { id: listingId }, data: { status: "REJECTED", moderationNote: reason } });
  await audit(admin.id, "listing.reject", "listing", listingId, reason);
  revalidatePath("/admin/listings");
}

// For fake, abusive or off-topic reviews only; honest negative reviews should stay up.
export async function setReviewVisibility(reviewId: string, visible: boolean) {
  const admin = await requireAdmin();
  await db.review.update({ where: { id: reviewId }, data: { status: visible ? "VISIBLE" : "HIDDEN" } });
  await audit(admin.id, visible ? "review.restore" : "review.hide", "review", reviewId);
  revalidatePath("/admin");
}

// Suspension signs the user out everywhere and hides their listings and reviews.
export async function setSuspended(userId: string, suspend: boolean, form: FormData) {
  const admin = await requireAdmin();
  if (userId === admin.id) return;
  const reason = note(form);
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: suspend ? { suspendedAt: new Date(), suspendReason: reason } : { suspendedAt: null, suspendReason: "" },
    }),
    ...(suspend ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  await audit(admin.id, suspend ? "user.suspend" : "user.unsuspend", "user", userId, reason);
  revalidatePath("/admin/users");
}
