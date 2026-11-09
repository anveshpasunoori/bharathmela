-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "stripeInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "public"."VendorProfile" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeInvoiceId_key" ON "public"."Subscription"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_stripeCustomerId_key" ON "public"."VendorProfile"("stripeCustomerId");

