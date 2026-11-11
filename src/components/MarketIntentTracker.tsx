"use client";

import { useEffect } from "react";
import { intentForLink, type IntentKind } from "@/lib/market-intents";

export function recordMarketIntent(kind: IntentKind, action?: string | null, metro?: string | null, query?: string | null) {
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const body = JSON.stringify([kind, action, metro, query?.slice(0, 100)]);
  try {
    if (navigator.sendBeacon?.("/api/market-intent", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/market-intent", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // Measurement must not interrupt navigation.
  }
}

export function MarketIntentTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!event.isTrusted || event.button !== 0 || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.closest("[data-skip-market-intent]") || anchor.origin !== location.origin) return;
      const url = new URL(anchor.href);
      if (url.pathname === location.pathname && url.search === location.search) return;
      const intent = intentForLink(url);
      if (intent) recordMarketIntent(intent.kind, intent.action, intent.metro);
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-market-search")) return;
      const data = new FormData(form);
      const q = data.get("q");
      if (typeof q === "string" && q.trim()) {
        recordMarketIntent("search", data.get("category")?.toString(), data.get("metro")?.toString(), q);
      }
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
