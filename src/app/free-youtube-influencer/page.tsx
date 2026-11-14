import { FreeInfluencerPage } from "@/components/FreeInfluencerPage";
import { freeInfluencerMetadata } from "@/lib/free-influencer-pages";

export const metadata = freeInfluencerMetadata("youtube");

export default function FreeYoutubeInfluencerPage() {
  return <FreeInfluencerPage platform="youtube" />;
}
