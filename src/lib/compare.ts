// Pages for people searching for another site by name ("sulekha alternative", "craigslist for indians"):
// what BharathMela does, said plainly. Claims about other sites stay general and well known; every claim
// about BharathMela is something the site does today. Other sites' names are their owners' trademarks.
import { METROS } from "./metros";

export type Comparison = {
  slug: string;
  name: string;
  title: string; // the page's <title> and h1
  description: string;
  intro: string;
  // Side-by-side rows, only where the other site's side is plain fact.
  rows?: { label: string; them: string; us: string }[];
  faq: { q: string; a: string }[];
};

const CITIES = METROS.length;

// What BharathMela offers, true for every comparison.
export const OUR_POINTS = [
  { title: "Made for the Indian community", text: "Categories people actually need here: tiffins and home food, pujaris, mehndi, Bharatanatyam and Carnatic classes, tutors, wedding vendors, rooms and roommates, and more." },
  { title: `${CITIES} US cities`, text: "Each city has its own pages, and you can browse by distance from your ZIP code." },
  { title: "Reviews you can trust", text: "Ratings from the seller's own network, brand-new accounts and copied or paid-for reviews are held for a check before they show." },
  { title: "Post what you need, get quotes", text: "Describe the job once; local sellers who offer it get an email and send you quotes. Free for buyers." },
  { title: "Safer by design", text: "Every account confirms its email, listings are screened for banned and illegal items, and anyone can report a fake business or a scam conversation." },
  { title: "In your language", text: "Browse in English, Telugu, Hindi or Tamil, and filter tutors, lawyers and other professionals by the languages they speak." },
  { title: "Free to start", text: "Buyers never pay. Sellers list their first business free, with paid plans only for more listings." },
  { title: "More than classifieds", text: "Community events, rooms wanted posts, and creators and influencers who promote local businesses for cash or barter." },
];

export const COMPARISONS: Comparison[] = [
  {
    slug: "sulekha",
    name: "Sulekha",
    title: "Sulekha alternative: a site like Sulekha for Indians in the US",
    description: `BharathMela is a free marketplace for the Indian community in ${CITIES} US cities: home food, pujaris, tutors, wedding vendors, rooms and more, with checked reviews and free quotes.`,
    intro:
      "Sulekha has served the Indian community for many years. If you're looking for another place to find Indian home businesses, services, rooms and events in your US city, or another place to list your business, here's what BharathMela offers.",
    faq: [
      { q: "Is there a site like Sulekha for Indians in the US?", a: `Yes. BharathMela (also written Bharat Mela) is a free marketplace for the Indian community in ${CITIES} US cities, with home food, pujaris, tutors, wedding vendors, home services, rooms and events.` },
      { q: "Is BharathMela part of Sulekha?", a: "No. BharathMela is an independent marketplace and isn't affiliated with Sulekha." },
      { q: "Can I list my business on both?", a: "Yes. Many sellers list in several places. Your first BharathMela listing is free, so it costs nothing to add." },
      { q: "Does BharathMela charge buyers or take a cut of payments?", a: "No. Buyers browse, message sellers and post requests for free, and pay the seller directly." },
    ],
  },
  {
    slug: "craigslist",
    name: "Craigslist",
    title: "Indian Craigslist alternative: BharathMela, classifieds for the Indian community",
    description: `Like Craigslist, but made for Indians in the US: tiffins, pujaris, tutors, mehndi, rooms and roommates in ${CITIES} cities, with seller reviews, scam reporting and free quotes.`,
    intro:
      "Craigslist is a general classifieds site for everyone and every kind of ad. BharathMela is built only for the Indian community in the US, so the categories, filters and sellers are the ones you're looking for.",
    rows: [
      { label: "Built for", them: "Everyone, every kind of ad", us: "The Indian community in the US" },
      { label: "Categories like pujari, tiffin, mehndi, classical dance", them: "General categories", us: "Dedicated categories and filters" },
      { label: "Seller ratings and reviews", them: "No public seller ratings", us: "Yes, with checks against fake reviews" },
      { label: "Site in Telugu, Hindi or Tamil", them: "No", us: "Yes" },
      { label: "Post a request and get quotes", them: "No", us: "Yes, free" },
    ],
    faq: [
      { q: "Is BharathMela like Craigslist?", a: "It works in a similar way (local listings you browse and contact directly) but only for the Indian community, with seller profiles, reviews and community events." },
      { q: "Can I find Indian roommates and rooms?", a: "Yes. Browse rooms for rent in your city, or post a rooms wanted request so owners can contact you." },
      { q: "Is it free?", a: "Free for buyers. Sellers list their first business free; paid plans are only for more listings." },
    ],
  },
  {
    slug: "facebook-marketplace",
    name: "Facebook Marketplace and groups",
    title: "Beyond Facebook groups: a marketplace for Indians in the US",
    description: "Tired of scrolling Facebook groups for a tiffin service, pujari or roommate? BharathMela keeps Indian businesses and services searchable by city, category and price, with reviews.",
    intro:
      "Facebook Marketplace and community groups are where many Indian home businesses start. But posts in a group scroll away, and finding the right tiffin service or tutor means searching old threads. BharathMela keeps every listing searchable by city, category, price and distance.",
    faq: [
      { q: "Do I need a Facebook account?", a: "No. Create a free BharathMela account with just your email." },
      { q: "Can I share my listing in my groups too?", a: "Yes. Every listing has a share link with a preview card, and sellers get a QR code for their shop or flyers." },
    ],
  },
  {
    slug: "whatsapp-groups",
    name: "WhatsApp groups",
    title: "Better than WhatsApp groups for finding Indian businesses",
    description: "Find tiffins, pujaris, tutors, mehndi artists and rooms without digging through WhatsApp messages: search by city and category, compare prices and read reviews on BharathMela.",
    intro:
      "Community WhatsApp groups are great for news, but a message about a tiffin service or a room is gone after a few hours. BharathMela keeps them in one place you can search any time.",
    rows: [
      { label: "Find an old post", them: "Scroll back through chat", us: "Search by city, category and price" },
      { label: "Reviews from other buyers", them: "Ask the group", us: "Ratings on every seller" },
      { label: "Who can see it", them: "Only group members", us: "Anyone searching in your city" },
      { label: "Your phone number", them: "Shared with the whole group", us: "Message in the app; share your number only if you want" },
    ],
    faq: [
      { q: "Can I still share in my WhatsApp groups?", a: "Yes. Listings, seller pages and events have share links with a preview card, so posting them in groups brings people to the full details." },
    ],
  },
];

export const comparisonFromSlug = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
export const comparePath = (c: { slug: string }) => `/compare/${c.slug}`;
