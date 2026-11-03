import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Public pages are crawlable; accounts, dashboards, private requests and APIs aren't.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", "/admin", "/messages", "/vendor", "/account", "/saved", "/requests", "/alerts/", "/login", "/signup", "/verify",
          "/rooms-wanted/new", "/rooms-wanted/mine", "/*?*ss=", "/*?*sort=", "/*?*q=",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
