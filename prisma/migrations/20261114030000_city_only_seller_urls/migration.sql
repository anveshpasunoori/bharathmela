BEGIN;

ALTER TABLE "VendorProfile" ADD COLUMN "previousPublicPath" TEXT;
CREATE UNIQUE INDEX "VendorProfile_previousPublicPath_key" ON "VendorProfile"("previousPublicPath");

-- Coordinate with signup reservations and preserve each old address before changing it.
SELECT pg_advisory_xact_lock(64285319);
DO $$
DECLARE
  seller RECORD;
  city_slug TEXT;
  base_path TEXT;
  candidate TEXT;
  suffix INTEGER;
BEGIN
  FOR seller IN SELECT "id", "publicPath" FROM "VendorProfile"
    WHERE "publicPath" IS NOT NULL ORDER BY "createdAt", "id"
  LOOP
    city_slug := regexp_replace(split_part(seller."publicPath", '/', 2), '-[a-z]{2}$', '');
    IF city_slug = ANY(ARRAY['about','account','actions','admin','alerts','api','categories','city-emails','compare','contact','creators','events','free-instagram-influencer','free-youtube-influencer','hire-influencers','in','indian-classifieds','influencers','listing','login','messages','pricing','privacy','requests','rooms-wanted','safety','saved','seller','signup','terms','vendor','verify']) THEN
      city_slug := city_slug || '-city';
    END IF;
    base_path := '/' || city_slug || '/' || split_part(seller."publicPath", '/', 3);
    IF base_path = seller."publicPath" THEN CONTINUE; END IF;
    candidate := base_path;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "VendorProfile" WHERE "publicPath" = candidate OR "previousPublicPath" = candidate) LOOP
      candidate := base_path || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    UPDATE "VendorProfile" SET "previousPublicPath" = seller."publicPath", "publicPath" = candidate WHERE "id" = seller."id";
  END LOOP;
END $$;

COMMIT;
