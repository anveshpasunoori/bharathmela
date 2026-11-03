-- CreateIndex
CREATE INDEX "Message_toUserId_createdAt_idx" ON "public"."Message"("toUserId", "createdAt");
