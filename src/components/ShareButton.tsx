"use client";

import { useState } from "react";

// Uses the phone's share sheet when available (WhatsApp, Messages…), otherwise copies the link.
export function ShareButton({ title, text, className = "btn-outline" }: { title: string; text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    // Tagged so visits from shared links show up under Admin → Growth.
    const url = `${window.location.href.split("?")[0]}?utm_source=share&utm_medium=share&utm_campaign=listing`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Cancelled or blocked: fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
    }
  }
  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "✓ Link copied" : "↗ Share"}
    </button>
  );
}
