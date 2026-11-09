-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "cityEmailMetro" TEXT,
ADD COLUMN     "cityEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "cityEmailToken" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
ADD COLUMN     "cityEmails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signupCampaign" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "signupSource" TEXT NOT NULL DEFAULT '';

-- Existing users got a random token above; new ones get a cuid from Prisma.
ALTER TABLE "public"."User" ALTER COLUMN "cityEmailToken" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."VendorProfile" ADD COLUMN     "foundingSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralRewardedAt" TIMESTAMP(3),
ADD COLUMN     "referredById" TEXT;

-- CreateTable
CREATE TABLE "public"."ReviewRequest" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRequest_buyerId_vendorId_key" ON "public"."ReviewRequest"("buyerId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_cityEmailToken_key" ON "public"."User"("cityEmailToken");

-- AddForeignKey
ALTER TABLE "public"."VendorProfile" ADD CONSTRAINT "VendorProfile_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "public"."VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewRequest" ADD CONSTRAINT "ReviewRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewRequest" ADD CONSTRAINT "ReviewRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

