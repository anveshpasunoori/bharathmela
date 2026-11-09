-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "conversationId" TEXT;

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "otherId" TEXT NOT NULL,
    "listingId" TEXT,
    "roomWantedId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSenderId" TEXT,
    "startedByReadAt" TIMESTAMP(3),
    "otherReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_startedById_lastMessageAt_idx" ON "public"."Conversation"("startedById", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_otherId_lastMessageAt_idx" ON "public"."Conversation"("otherId", "lastMessageAt");

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_otherId_fkey" FOREIGN KEY ("otherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_roomWantedId_fkey" FOREIGN KEY ("roomWantedId") REFERENCES "public"."RoomWanted"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing messages: one conversation per pair of people and listing (or room post), started by whoever
-- wrote first, and marked read up to its last message so nobody sees a flood of old "unread" messages.
INSERT INTO "public"."Conversation" ("id", "startedById", "otherId", "listingId", "roomWantedId", "lastMessageAt", "lastSenderId", "startedByReadAt", "otherReadAt", "createdAt")
SELECT gen_random_uuid()::text, f."fromUserId", f."toUserId", g."listingId", g."roomWantedId", g."lastAt", l."fromUserId", g."lastAt", g."lastAt", g."firstAt"
FROM (
  SELECT LEAST("fromUserId", "toUserId") AS a, GREATEST("fromUserId", "toUserId") AS b, "listingId", "roomWantedId",
         MIN("createdAt") AS "firstAt", MAX("createdAt") AS "lastAt"
  FROM "public"."Message" GROUP BY 1, 2, 3, 4
) g
JOIN LATERAL (
  SELECT m."fromUserId", m."toUserId" FROM "public"."Message" m
  WHERE LEAST(m."fromUserId", m."toUserId") = g.a AND GREATEST(m."fromUserId", m."toUserId") = g.b
    AND m."listingId" IS NOT DISTINCT FROM g."listingId" AND m."roomWantedId" IS NOT DISTINCT FROM g."roomWantedId"
  ORDER BY m."createdAt" ASC LIMIT 1
) f ON true
JOIN LATERAL (
  SELECT m."fromUserId" FROM "public"."Message" m
  WHERE LEAST(m."fromUserId", m."toUserId") = g.a AND GREATEST(m."fromUserId", m."toUserId") = g.b
    AND m."listingId" IS NOT DISTINCT FROM g."listingId" AND m."roomWantedId" IS NOT DISTINCT FROM g."roomWantedId"
  ORDER BY m."createdAt" DESC LIMIT 1
) l ON true;

UPDATE "public"."Message" m SET "conversationId" = c."id"
FROM "public"."Conversation" c
WHERE LEAST(m."fromUserId", m."toUserId") = LEAST(c."startedById", c."otherId")
  AND GREATEST(m."fromUserId", m."toUserId") = GREATEST(c."startedById", c."otherId")
  AND m."listingId" IS NOT DISTINCT FROM c."listingId" AND m."roomWantedId" IS NOT DISTINCT FROM c."roomWantedId";
