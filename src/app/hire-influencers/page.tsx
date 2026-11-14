import type { Metadata } from "next";
import { InfluencerMarketplace } from "@/components/InfluencerMarketplace";

const title = "Hire Indian YouTube & Social Media Influencers in the US";
const description = "Find Indian YouTube influencers, Instagram creators and micro-influencers in the US. Compare profiles and rates or post a paid or barter collaboration request.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/hire-influencers" },
  openGraph: { title, description, url: "/hire-influencers", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function HireInfluencersPage() {
  return <InfluencerMarketplace audience="brands" />;
}
