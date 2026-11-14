ALTER TABLE "VendorProfile" ADD COLUMN "publicPath" TEXT;
CREATE UNIQUE INDEX "VendorProfile_publicPath_key" ON "VendorProfile"("publicPath");
