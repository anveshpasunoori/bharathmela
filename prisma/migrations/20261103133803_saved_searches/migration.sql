-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" TEXT NOT NULL DEFAULT '',
    "metro" TEXT NOT NULL,
    "nearLat" REAL,
    "nearLng" REAL,
    "nearCity" TEXT NOT NULL DEFAULT '',
    "radiusMiles" INTEGER,
    "alerts" TEXT NOT NULL DEFAULT 'DAILY',
    "alertedUntil" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAlertAt" DATETIME,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_unsubscribeToken_key" ON "SavedSearch"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_alerts_lastAlertAt_idx" ON "SavedSearch"("alerts", "lastAlertAt");
