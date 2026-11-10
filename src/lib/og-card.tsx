import { ImageResponse } from "next/og";

// The share card shown when a page is posted to WhatsApp, Facebook, X or iMessage: the BharathMela mark,
// a small label, a big title, an optional highlight line and a footer.
export const OG_SIZE = { width: 1200, height: 630 };

export function shareCard({ kicker, title, highlight, footer }: { kicker: string; title: string; highlight?: string | null; footer: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#c2410c", color: "#fff", fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>BM</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#c2410c" }}>BharathMela</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, color: "#9a3412", textTransform: "uppercase", letterSpacing: 2 }}>{kicker.slice(0, 60)}</div>
          <div style={{ fontSize: title.length > 50 ? 60 : 72, fontWeight: 700, color: "#1c1917", lineHeight: 1.1, display: "flex" }}>{title.slice(0, 90)}</div>
          {highlight && <div style={{ fontSize: 40, color: "#1c1917", display: "flex" }}>{highlight.slice(0, 70)}</div>}
        </div>
        <div style={{ fontSize: 30, color: "#57534e", display: "flex" }}>{footer.slice(0, 80)}</div>
      </div>
    ),
    OG_SIZE,
  );
}
