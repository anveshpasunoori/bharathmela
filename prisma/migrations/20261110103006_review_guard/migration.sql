-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "holdReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ipHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verifiedContact" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastIpHash" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Review_vendorId_createdAt_idx" ON "public"."Review"("vendorId", "createdAt");

