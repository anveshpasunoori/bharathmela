import type { Metadata } from "next";

export const FREE_INFLUENCER_PAGES = {
  instagram: {
    platform: "Instagram",
    path: "/free-instagram-influencer",
    title: "Free Instagram Influencer Listing for Brand Collaborations",
    description: "Create your first Instagram influencer listing free on BharathMela. Showcase Reels, stories and posts to connect with Indian businesses across the US.",
    h1: "Create your first Instagram influencer listing for free",
    intro: "Help brands discover your Instagram content. Showcase your niche, audience and creative style to Indian businesses looking for local and nationwide collaborations in the US.",
    formatsHeading: "Showcase Instagram Reels, stories and sponsored posts",
    formats: [
      ["Reels", "Share examples of your short-form storytelling, product demonstrations or local business visits. List your rate for a Reel and describe what production includes."],
      ["Stories", "Describe the story coverage you offer, such as an event visit or product introduction. Agree on the number of frames and any links with the business."],
      ["Feed posts", "Show brands how products fit into your photography and captions. Discuss whether a collaboration includes a single image or a carousel."],
    ],
    profileHeading: "Build an Instagram profile that helps brands assess the fit",
    profileText: "Add your Instagram handle, current follower count, content languages and sample posts. Describe the communities you reach and whether you can visit businesses locally or create content nationwide.",
    collabHeading: "Connect with brands for Instagram collaborations",
    collabText: "Food bloggers can showcase restaurant content, beauty creators can share product demonstrations, and lifestyle influencers can highlight everyday recommendations. Choose the niches that match your actual work and set clear rates for each format.",
    faqHeading: "Free Instagram influencer listing questions",
    question: "Can I offer Instagram collaborations as a micro-influencer?",
    answer: "Yes. There is no minimum follower requirement to create a listing. Share accurate audience information and sample content so a business can decide whether your Instagram account fits its campaign.",
  },
  youtube: {
    platform: "YouTube",
    path: "/free-youtube-influencer",
    title: "Free YouTube Influencer Listing for Sponsorship Opportunities",
    description: "List your YouTube creator services free with your first BharathMela listing. Showcase videos and Shorts, set rates and connect with brands across the US.",
    h1: "List your YouTube influencer services for free",
    intro: "Introduce your channel to businesses looking for YouTube creators. Share your videos, content niche and collaboration rates with Indian brands and local businesses across the US.",
    formatsHeading: "Present YouTube videos, Shorts and sponsorship options",
    formats: [
      ["YouTube videos", "Link to videos that show your presentation style and subject expertise. Set your video rate and explain whether you offer a dedicated video or a segment."],
      ["YouTube Shorts", "Show examples of concise demonstrations, discoveries or tutorials. List a Reel / Short rate and clarify the length and production scope in your proposal."],
      ["Sponsored integrations", "Describe how a brand could fit naturally into your channel’s topics. Agree on placement, talking points and approval steps before filming."],
    ],
    profileHeading: "Introduce your channel to potential sponsors",
    profileText: "Add your YouTube handle, current subscriber count and representative videos. Include your content languages and niche, and describe whether you film on location or work with businesses remotely across the US.",
    collabHeading: "Discuss YouTube sponsorships around your expertise",
    collabText: "Tech tutorials, food videos, family vlogs and travel guides give businesses different ways to introduce their products or services. Explain the topics you cover and share relevant samples when replying to a collaboration request.",
    faqHeading: "Free YouTube creator listing questions",
    question: "Can a small YouTube channel create a listing?",
    answer: "Yes. BharathMela does not require a minimum subscriber count to create a creator listing. Describe your channel accurately and share videos that help businesses evaluate your content and audience fit. Sponsorships are not guaranteed.",
  },
} as const;

export type FreeInfluencerPlatform = keyof typeof FREE_INFLUENCER_PAGES;

export function freeInfluencerMetadata(platform: FreeInfluencerPlatform): Metadata {
  const { title, description, path } = FREE_INFLUENCER_PAGES[platform];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
