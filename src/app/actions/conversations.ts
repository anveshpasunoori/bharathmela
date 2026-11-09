"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { postMessage } from "@/lib/conversations";
import { db } from "@/lib/db";
import { TOO_MANY, hit } from "@/lib/rate-limit";

export async function replyInConversation(conversationId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(`/messages/${conversationId}`);
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, OR: [{ startedById: user.id }, { otherId: user.id }] },
    include: { listing: { select: { title: true } }, roomWanted: { select: { title: true } } },
  });
  if (!conversation) return { error: "This conversation isn't available." };
  const otherId = conversation.startedById === user.id ? conversation.otherId : conversation.startedById;
  const other = await db.user.findUnique({ where: { id: otherId }, select: { deletedAt: true, suspendedAt: true } });
  if (!other || other.deletedAt || other.suspendedAt) return { error: "This person's account is closed, so they can't get messages." };
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > 2000) return { error: "Keep messages under 2,000 characters." };
  if (!(await hit("reply", user.id))) return { error: TOO_MANY };
  await postMessage(conversation, user, body, conversation.listing?.title ?? conversation.roomWanted?.title ?? "your conversation");
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { message: "sent" };
}
