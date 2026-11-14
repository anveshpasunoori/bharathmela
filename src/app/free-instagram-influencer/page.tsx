import { FreeInfluencerPage } from "@/components/FreeInfluencerPage";
import { freeInfluencerMetadata } from "@/lib/free-influencer-pages";

export const metadata = freeInfluencerMetadata("instagram");

export default function FreeInstagramInfluencerPage() {
  return <FreeInfluencerPage platform="instagram" />;
}
