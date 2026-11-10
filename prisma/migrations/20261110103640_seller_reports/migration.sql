-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "reporterKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vendorId" TEXT;

-- CreateIndex
CREATE INDEX "Report_vendorId_idx" ON "public"."Report"("vendorId");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

