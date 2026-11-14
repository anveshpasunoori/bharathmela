import { ImageResponse } from "next/og";

// The share card shown when a page is posted to WhatsApp, Facebook, X or iMessage: the BharathMela pin and
// name, a small label, a big title, an optional highlight line and a footer, in the site's forest green,
// saffron and ivory.
export const OG_SIZE = { width: 1200, height: 630 };

const FOREST = "#145638";
const SAFFRON_DARK = "#c0530b"; // readable saffron for text on ivory
const INK = "#202923";
const MUTED = "#5b655e";

// The storefront pin from src/app/icon.svg, drawn inline so the card needs no file or network fetch.
function Pin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path fill="#0C4A2B" d="M32 2C18 2 7 13 7 26c0 11 8.8 22 22.2 34.5a4.1 4.1 0 0 0 5.6 0C48.2 48 57 37 57 26 57 13 46 2 32 2Z" />
      <path fill="#FFF3DA" d="M18 29c2.9.8 6-.2 8-2.7a7.7 7.7 0 0 0 12 0c2 2.5 5.1 3.5 8 2.7v12.6a2 2 0 0 1-2 2h-7.2v-5.5a4.8 4.8 0 0 0-9.6 0v5.5H20a2 2 0 0 1-2-2Z" />
      <path fill="#F28A16" d="M19.2 16h25.6c.5 0 1 .2 1.3.6l3.9 5.2a6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0l3.9-5.2c.3-.4.8-.6 1.3-.6Z" />
    </svg>
  );
}

export function shareCard({ kicker, title, highlight, footer }: { kicker: string; title: string; highlight?: string | null; footer: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #faf8f2 0%, #edf5ef 100%)", borderBottom: `14px solid ${FOREST}`, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Pin size={68} />
          <div style={{ fontSize: 38, fontWeight: 700, color: FOREST }}>BharathMela</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: SAFFRON_DARK, textTransform: "uppercase", letterSpacing: 2 }}>{kicker.slice(0, 60)}</div>
          <div style={{ fontSize: title.length > 50 ? 60 : 72, fontWeight: 700, color: INK, lineHeight: 1.1, display: "flex" }}>{title.slice(0, 90)}</div>
          {highlight && <div style={{ fontSize: 40, color: FOREST, fontWeight: 700, display: "flex" }}>{highlight.slice(0, 70)}</div>}
        </div>
        <div style={{ fontSize: 30, color: MUTED, display: "flex" }}>{footer.slice(0, 80)}</div>
      </div>
    ),
    OG_SIZE,
  );
}
