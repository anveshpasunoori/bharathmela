import type { Metadata } from "next";
import { CreatorsHub } from "@/components/CreatorsHub";
import { CREATORS_PATH } from "@/lib/creator-pages";

// Indian creators and influencers from every city, for businesses looking for someone to promote them.
export const metadata: Metadata = {
  title: "Indian Influencers & Content Creators in the US",
  description:
    "Find Indian food bloggers, beauty, dance and family creators and local influencers across the US. Compare followers, niches, languages and rates, verified handles, and creators open to barter collabs.",
  alternates: { canonical: CREATORS_PATH },
  openGraph: { title: "Indian Influencers & Content Creators in the US", url: CREATORS_PATH },
};

export default function CreatorsPage() {
  return <CreatorsHub page={{ kind: "all" }} />;
}
