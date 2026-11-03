-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "serviceRequestId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "public"."ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
