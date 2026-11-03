import { ImageResponse } from "next/og";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { priceLabel } from "@/lib/plans";
import { idFromSlugParam } from "@/lib/seo";

// The share card for listings without a photo (WhatsApp, Facebook, X, iMessage previews).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BharathMela listing";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const listing = await db.listing.findUnique({
    where: { id: idFromSlugParam((await params).id) },
    select: { title: true, category: true, metro: true, priceCents: true, priceUnit: true, vendor: { select: { businessName: true } } },
  });
  const price = listing?.priceCents != null ? priceLabel(listing.priceCents, listing.priceUnit) : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#c2410c", color: "#fff", fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>BM</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#c2410c" }}>BharathMela</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, color: "#9a3412", textTransform: "uppercase", letterSpacing: 2 }}>{listing ? categoryLabel(listing.category) : "Listing"}</div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#1c1917", lineHeight: 1.1, display: "flex" }}>{(listing?.title ?? "Indian home businesses near you").slice(0, 90)}</div>
          {price && <div style={{ fontSize: 40, color: "#1c1917" }}>{`${price.main} ${price.unit}`.trim()}</div>}
        </div>
        <div style={{ fontSize: 30, color: "#57534e", display: "flex" }}>
          {listing ? `${listing.vendor.businessName} · ${metroName(listing.metro)}` : "Indian home businesses near you"}
        </div>
      </div>
    ),
    size,
  );
}
