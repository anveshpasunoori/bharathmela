// Vendor pricing. Edit here to change what vendors pay.

export const PLAN_PERIOD_DAYS = 30;

export const PLANS = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceCents: 0,
    maxListings: 1,
    maxEvents: 1,
    perks: ["1 active listing", "1 upcoming event", "Shown in your city's search"],
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceCents: 999,
    maxListings: 5,
    maxEvents: 3,
    perks: ["Up to 5 active listings", "Up to 3 upcoming events", "Shown in your city's search"],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceCents: 2499,
    maxListings: 25,
    maxEvents: 10,
    perks: [
      "Up to 25 active listings",
      "Up to 10 upcoming events",
      "AI ad writer: turn your idea into a ready-to-post ad",
      "\"Pro seller\" badge on every listing",
      "Ranked above Free and Basic listings",
    ],
  },
} as const;

// Plans that include the AI ad writer, and how many drafts a vendor can generate per day.
export const AI_WRITER_PLANS: readonly PlanId[] = ["PRO"];
export const AI_DAILY_LIMIT = 20;

export type PlanId = keyof typeof PLANS;
export const PAID_PLAN_IDS = ["BASIC", "PRO"] as const;

export function isPaidPlan(id: string): id is (typeof PAID_PLAN_IDS)[number] {
  return (PAID_PLAN_IDS as readonly string[]).includes(id);
}

// Featured ad boosts: a listing is pinned to the top of its city and category.
export const BOOSTS = [
  { days: 7, priceCents: 500 },
  { days: 30, priceCents: 1500 },
] as const;

export function boostOption(days: number) {
  return BOOSTS.find((b) => b.days === days);
}

// "$1,400" for whole dollars, "$9.99" otherwise.
export function formatUSD(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 });
}
