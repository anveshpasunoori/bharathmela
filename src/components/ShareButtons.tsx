"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// Share a page on WhatsApp, Facebook, by the phone's own share sheet, or by copying the link. Each
// channel's link is tagged (utm_source) so visits and sign-ups can be traced back to it.
export function ShareButtons({ url, text, campaign, compact = false }: { url: string; text: string; campaign: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const tagged = (source: string) => {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  };
  const button = `inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-stone-300 hover:ring-brand/50 hover:text-brand ${compact ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} font-medium text-stone-700`;
  // The phone's share sheet, where there is one; known only in the browser, so the server renders without it.
  const canShare = useSyncExternalStore(noSubscribe, () => "share" in navigator, () => false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a className={button} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${tagged("whatsapp")}`)}`}>
        <span aria-hidden className="text-green-600">●</span> WhatsApp
      </a>
      <a className={button} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tagged("facebook"))}`}>
        <span aria-hidden className="text-blue-600">●</span> Facebook
      </a>
      <button
        type="button"
        className={button}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(tagged("link"));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link:", tagged("link"));
          }
        }}
      >
        {copied ? "✓ Copied" : "Copy link"}
      </button>
      {canShare && (
        <button type="button" className={button} onClick={() => navigator.share({ title: text, url: tagged("share") }).catch(() => {})}>
          More…
        </button>
      )}
    </div>
  );
}
