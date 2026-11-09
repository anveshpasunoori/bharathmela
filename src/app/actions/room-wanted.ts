"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOrStartConversation, postMessage } from "@/lib/conversations";
import { REPORT_REASONS } from "@/lib/legal";
import { isMetro } from "@/lib/metros";
import { screenListing } from "@/lib/moderation";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { MAX_ACTIVE_WANTED, WANTED_DAYS, type WantedInput, parseWantedForm } from "@/lib/rooms-wanted";

const DAY_MS = 86_400_000;
const MIN_ACCOUNT_AGE_MS = 10 * 60_000;

async function requireVerified(next: string) {
  const user = await requireUser(next);
  if (!user.emailVerifiedAt) redirect(`/verify?next=${encodeURIComponent(next)}`);
  return user;
}

async function ownPost(userId: string, id: string) {
  const post = await db.roomWanted.findUnique({ where: { id } });
  if (!post || post.userId !== userId) throw new Error("Post not found");
  return post;
}

// Renters describing themselves ("vegetarian student") is fine, so preference wording isn't held here;
// prohibited items and scam signals still are.
function moderate(input: WantedInput) {
  const screening = screenListing(`${input.title}\n${input.description}\n${input.areas}`, "ROOM_WANTED");
  if (screening.block) return { error: screening.block } as const;
  const flags = screening.flags.filter((f) => !f.startsWith("preference wording"));
  return flags.length
    ? ({ status: "PENDING_REVIEW", moderationNote: flags.join("; ") } as const)
    : ({ status: "ACTIVE", moderationNote: "" } as const);
}

async function activeCount(userId: string, excludeId?: string) {
  return db.roomWanted.count({
    where: {
      userId,
      status: { in: ["ACTIVE", "PENDING_REVIEW"] },
      expiresAt: { gt: new Date() },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createWanted(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireVerified("/rooms-wanted/new");
  const metro = String(form.get("metro") ?? "");
  if (!isMetro(metro)) return { error: "Choose your city." };
  if (Date.now() - user.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) return { error: "New accounts can post 10 minutes after signing up." };
  const input = parseWantedForm(form);
  if ("error" in input) return input;
  if (!(await hit("listing", user.id))) return { error: TOO_MANY };
  if ((await activeCount(user.id)) >= MAX_ACTIVE_WANTED) {
    return { error: `You can have ${MAX_ACTIVE_WANTED} active posts. Hide or delete one first.` };
  }
  const decision = moderate(input);
  if ("error" in decision) return decision;
  const post = await db.roomWanted.create({
    data: { userId: user.id, metro, ...input, ...decision, expiresAt: new Date(Date.now() + WANTED_DAYS * DAY_MS) },
  });
  redirect(decision.status === "ACTIVE" ? `/rooms-wanted/${post.id}?posted=1` : "/rooms-wanted/mine?review=1");
}

export async function updateWanted(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireVerified("/rooms-wanted/mine");
  const post = await ownPost(user.id, String(form.get("id") ?? ""));
  if (post.status === "REMOVED") return { error: "This post was removed by BharathMela and can't be edited." };
  const input = parseWantedForm(form);
  if ("error" in input) return input;
  if (!(await hit("listing", user.id))) return { error: TOO_MANY };
  const decision = moderate(input);
  if ("error" in decision) return decision;
  const status =
    decision.status === "PENDING_REVIEW" || post.status === "REJECTED" || post.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : post.status;
  await db.roomWanted.update({
    where: { id: post.id },
    data: { ...input, status, moderationNote: status === "PENDING_REVIEW" ? decision.moderationNote || "edited after rejection" : "" },
  });
  revalidatePath(`/rooms-wanted/${post.id}`);
  redirect(status === "PENDING_REVIEW" ? "/rooms-wanted/mine?review=1" : "/rooms-wanted/mine?saved=1");
}

export async function setWantedVisibility(id: string, visible: boolean) {
  const user = await requireVerified("/rooms-wanted/mine");
  const post = await ownPost(user.id, id);
  if (post.status !== "ACTIVE" && post.status !== "HIDDEN") return;
  if (visible && (await activeCount(user.id, id)) >= MAX_ACTIVE_WANTED) redirect("/rooms-wanted/mine?error=limit");
  await db.roomWanted.update({ where: { id }, data: { status: visible ? "ACTIVE" : "HIDDEN" } });
  revalidatePath("/rooms-wanted/mine");
}

export async function renewWanted(id: string) {
  const user = await requireVerified("/rooms-wanted/mine");
  const post = await ownPost(user.id, id);
  if (post.status === "REMOVED" || post.status === "REJECTED") return;
  if (post.expiresAt <= new Date() && (await activeCount(user.id, id)) >= MAX_ACTIVE_WANTED) redirect("/rooms-wanted/mine?error=limit");
  await db.roomWanted.update({ where: { id }, data: { expiresAt: new Date(Date.now() + WANTED_DAYS * DAY_MS) } });
  revalidatePath("/rooms-wanted/mine");
}

export async function deleteWanted(id: string) {
  const user = await requireVerified("/rooms-wanted/mine");
  await ownPost(user.id, id);
  await db.roomWanted.delete({ where: { id } });
  revalidatePath("/rooms-wanted/mine");
}

// Owners reach renters through us: the renter gets an email with the owner's message, and
// replying goes straight to the owner. Neither side's email is shown on the site.
export async function contactRenter(_: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/rooms-wanted/${id}`);
  if (!user.emailVerifiedAt) redirect(`/verify?next=/rooms-wanted/${id}`);
  if (Date.now() - user.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) return { error: "New accounts can send messages 10 minutes after signing up." };
  const post = await db.roomWanted.findUnique({ where: { id }, include: { user: true } });
  if (!post || post.status !== "ACTIVE" || post.expiresAt <= new Date()) return { error: "This post is no longer active." };
  if (post.userId === user.id) return { error: "That's your own post." };
  const body = String(form.get("message") ?? "").trim();
  if (body.length < 20 || body.length > 2000) return { error: "Write a short message (20 to 2,000 characters) about your place." };
  const screening = screenListing(body, "ROOM_RENTAL");
  if (screening.block) return { error: screening.block };
  if (screening.flags.some((f) => /wire|gift card|crypto|before viewing|absentee/.test(f))) {
    return { error: "Messages asking for wire transfers, gift cards, crypto or payment before viewing aren't allowed." };
  }
  if (!(await hit("message", user.id))) return { error: TOO_MANY };
  const conversation = await findOrStartConversation(user.id, post.userId, { roomWantedId: post.id });
  await postMessage(conversation, user, body, post.title);
  redirect(`/messages/${conversation.id}?sent=1`);
}

export async function reportWanted(_: FormState, form: FormData): Promise<FormState> {
  const roomWantedId = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "");
  if (!(await hit("report", await clientIp()))) return { error: TOO_MANY };
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "Choose a reason." };
  const post = await db.roomWanted.findUnique({ where: { id: roomWantedId }, select: { id: true, status: true } });
  if (!post) return { error: "This post no longer exists." };
  await db.report.create({
    data: {
      roomWantedId,
      reason,
      details: String(form.get("details") ?? "").trim().slice(0, 2000),
      reporterEmail: String(form.get("email") ?? "").trim().slice(0, 200),
    },
  });
  const open = await db.report.count({ where: { roomWantedId, status: "OPEN" } });
  if (open >= 3 && post.status === "ACTIVE") {
    await db.roomWanted.update({ where: { id: roomWantedId }, data: { status: "PENDING_REVIEW", moderationNote: `held automatically after ${open} reports` } });
  }
  return { message: "Thanks. Our team will review this post." };
}
