import "server-only";
// Conversations between two people about a listing or a room post. Messages stay on BharathMela (no email
// addresses are shared); the other person gets an email saying there's a new message, with a link back.
import { db } from "./db";
import { sendEmail } from "./email";
import { hit } from "./rate-limit";
import { absoluteUrl } from "./seo";

type About = { listingId: string; roomWantedId?: undefined } | { roomWantedId: string; listingId?: undefined };

export async function findOrStartConversation(fromUserId: string, toUserId: string, about: About) {
  const existing = await db.conversation.findFirst({
    where: {
      OR: [
        { startedById: fromUserId, otherId: toUserId },
        { startedById: toUserId, otherId: fromUserId },
      ],
      listingId: about.listingId ?? null,
      roomWantedId: about.roomWantedId ?? null,
    },
  });
  return existing ?? db.conversation.create({ data: { startedById: fromUserId, otherId: toUserId, ...about } });
}

type Conversation = { id: string; startedById: string; otherId: string; listingId: string | null; roomWantedId: string | null };

export async function postMessage(conversation: Conversation, from: { id: string; name: string }, body: string, subject: string) {
  const toUserId = conversation.startedById === from.id ? conversation.otherId : conversation.startedById;
  const now = new Date();
  const fromStarter = conversation.startedById === from.id;
  await db.$transaction([
    db.message.create({
      data: { conversationId: conversation.id, fromUserId: from.id, toUserId, listingId: conversation.listingId, roomWantedId: conversation.roomWantedId, body },
    }),
    db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now, lastSenderId: from.id, ...(fromStarter ? { startedByReadAt: now } : { otherReadAt: now }) },
    }),
  ]);
  // Email the other person, at most once every 30 minutes per conversation, so a back-and-forth doesn't
  // fill their inbox.
  if (await hit("messageNotify", `${conversation.id}:${toUserId}`)) {
    const to = await db.user.findUnique({ where: { id: toUserId }, select: { email: true, name: true, deletedAt: true } });
    if (to && !to.deletedAt) {
      await sendEmail(
        to.email,
        `${from.name.split(" ")[0]} sent you a message about "${subject}"`,
        `Hi ${to.name.split(" ")[0]},\n\n${from.name.split(" ")[0]} wrote on BharathMela about "${subject}":\n\n"${body.slice(0, 300)}${body.length > 300 ? "…" : ""}"\n\nReply on BharathMela: ${absoluteUrl(`/messages/${conversation.id}`)}\n\nStay safe: confirm details in writing, and never pay with gift cards, wire transfers or crypto.\n\n– BharathMela`,
      );
    }
  }
  return toUserId;
}

// Conversations with a message the user hasn't seen yet.
export async function unreadCount(userId: string) {
  const rows = await db.conversation.findMany({
    where: { OR: [{ startedById: userId }, { otherId: userId }], lastSenderId: { not: userId } },
    select: { startedById: true, lastMessageAt: true, startedByReadAt: true, otherReadAt: true },
    take: 500,
  });
  return rows.filter((c) => {
    const read = c.startedById === userId ? c.startedByReadAt : c.otherReadAt;
    return !read || read < c.lastMessageAt;
  }).length;
}
