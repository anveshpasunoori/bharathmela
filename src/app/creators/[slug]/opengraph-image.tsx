import { creatorPageFromSlug, creatorPageTitle, creatorsFor } from "@/lib/creator-pages";
import { OG_SIZE, shareCard } from "@/lib/og-card";

// The share card for a niche or language page of creators.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Creators on BharathMela";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const page = creatorPageFromSlug((await params).slug) ?? { kind: "all" as const };
  const count = (await creatorsFor(page)).length;
  const title = creatorPageTitle(page);
  return shareCard({
    kicker: "Creators & Influencers",
    title: title.charAt(0).toUpperCase() + title.slice(1),
    highlight: count ? `${count} creator${count === 1 ? "" : "s"} · paid or barter collabs` : "Paid or barter collabs",
    footer: "Across the US · bharathmela.com",
  });
}
