import type { Metadata } from "next";
import { InfluencerMarketplace } from "@/components/InfluencerMarketplace";

const title = "Influencer Marketplace for Brand Collaborations";
const description = "Join BharathMela as an Indian YouTube or social media creator in the US. Showcase your content and rates, and connect with brands for paid or barter collaborations.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/influencers" },
  openGraph: { title, description, url: "/influencers", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function InfluencersPage() {
  return <InfluencerMarketplace audience="creators" />;
}
