CREATE TABLE "MarketIntent" (
  "day" DATE NOT NULL,
  "metro" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  CONSTRAINT "MarketIntent_pkey" PRIMARY KEY ("day", "metro", "action", "kind", "visitorKey")
);
CREATE INDEX "MarketIntent_metro_day_idx" ON "MarketIntent"("metro", "day");
