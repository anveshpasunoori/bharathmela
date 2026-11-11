ALTER TABLE "VendorProfile" ADD COLUMN "boostTrialUsedAt" TIMESTAMP(3);
ALTER TABLE "AdBoost" ADD COLUMN "viewTrackingStartedAt" TIMESTAMP(3), ADD COLUMN "trackedViews" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ListingView" (
  "listingId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "visitorKey" TEXT NOT NULL,
  CONSTRAINT "ListingView_pkey" PRIMARY KEY ("listingId", "day", "visitorKey"),
  CONSTRAINT "ListingView_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ListingView_day_idx" ON "ListingView"("day");
