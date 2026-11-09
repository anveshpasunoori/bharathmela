-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "listingId" TEXT,
    "kind" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_vendorId_createdAt_idx" ON "public"."Lead"("vendorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_vendorId_kind_visitorKey_key" ON "public"."Lead"("vendorId", "kind", "visitorKey");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

