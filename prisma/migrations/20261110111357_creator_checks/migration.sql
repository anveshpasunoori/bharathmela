-- CreateTable
CREATE TABLE "public"."CreatorCheck" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorCheck_status_idx" ON "public"."CreatorCheck"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorCheck_listingId_platform_key" ON "public"."CreatorCheck"("listingId", "platform");

-- AddForeignKey
ALTER TABLE "public"."CreatorCheck" ADD CONSTRAINT "CreatorCheck_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

