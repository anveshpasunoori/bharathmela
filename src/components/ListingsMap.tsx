"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { id: string; href: string; title: string; price: string | null; lat: number; lng: number };

// Map tiles from OpenStreetMap (free, with attribution). Fine for a young site; at higher traffic switch to
// a tile service with a key (MapTiler, Stadia) and add its host to img-src in next.config.ts.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Listings as price pins. Points are ZIP-code areas, never a seller's address.
export function ListingsMap({ points }: { points: MapPoint[] }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    // Leaflet touches `window`, so it loads in the browser only.
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false });
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 17 }).addTo(map);
      const markers = points.map((p) =>
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "",
            html: `<span class="map-pin">${escape(p.price ?? "•")}</span>`,
            iconSize: undefined,
            iconAnchor: [0, 0],
          }),
          title: p.title,
        })
          .bindPopup(`<a href="${escape(p.href)}" class="map-popup">${escape(p.title)}${p.price ? `<br><b>${escape(p.price)}</b>` : ""}</a>`)
          .addTo(map!),
      );
      if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2), { maxZoom: 12 });
      else map.setView([39.5, -98.35], 4);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);
  return <div ref={box} className="z-0 h-[65vh] min-h-80 w-full overflow-hidden rounded-xl ring-1 ring-stone-200" role="region" aria-label="Map of listings" />;
}
