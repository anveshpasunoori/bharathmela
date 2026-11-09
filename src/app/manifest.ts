import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// Lets phones install BharathMela to the home screen like an app (icons from scripts/app-icons.mjs).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} – Indian home businesses near you`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/?utm_source=app&utm_medium=installed",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#c2410c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Events", url: "/events" },
      { name: "Saved", url: "/saved" },
      { name: "Post what you need", url: "/requests/new" },
    ],
  };
}
