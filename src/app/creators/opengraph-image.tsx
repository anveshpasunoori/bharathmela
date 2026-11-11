import { creatorsFor } from "@/lib/creator-pages";
import { OG_SIZE, shareCard } from "@/lib/og-card";

// The creator count is live data. Keep this image out of build-time prerendering.
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Indian influencers and content creators on BharathMela";

export default async function Image() {
  const count = (await creatorsFor({ kind: "all" })).length;
  return shareCard({
    kicker: "Creators & Influencers",
    title: "Indian influencers & content creators in the US",
    highlight: count ? `${count} creator${count === 1 ? "" : "s"} · paid or barter collabs` : "Paid or barter collabs",
    footer: "For businesses that want to be seen · bharathmela.com",
  });
}
