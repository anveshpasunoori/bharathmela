import { OG_SIZE, shareCard } from "@/lib/og-card";
import { SITE_TAGLINE } from "@/lib/seo";

// The share card for pages without one of their own.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BharathMela: Indian home businesses near you";

export default function Image() {
  return shareCard({ kicker: "Local marketplace", title: SITE_TAGLINE, highlight: "Home food, tutors, pujaris, wedding vendors and more", footer: "Free for buyers · bharathmela.com" });
}
