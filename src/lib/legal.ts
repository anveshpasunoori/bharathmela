// Platform-liability text shown across the app. Have a lawyer review before launch.

// Bump when the Terms change materially; sellers who accepted an older version can be re-prompted.
export const TERMS_VERSION = "2026-11-02";

export const SITE_NAME = "DesiBazaar";

export const PLATFORM_DISCLAIMER =
  `${SITE_NAME} is a listing platform only. Listings are posted by independent sellers, not by ${SITE_NAME}. ` +
  "We do not verify, employ, endorse or guarantee any seller, product, service or property, and we are not a party to any deal you make. " +
  "Meet safely, check credentials yourself, and never pay in advance to someone you haven't verified.";

// A new seller's first listing waits for an admin before going live.
export const REVIEW_FIRST_LISTING = true;

// Rules shown to sellers when they post in a category, and to buyers on those listings.
// requiresReview: every listing in the category is checked by an admin before going live.
export const CATEGORY_RULES: Record<string, { seller: string[]; buyer?: string; requiresReview?: boolean }> = {
  FOOD: {
    seller: [
      "You are responsible for following your state and county cottage food or food-handling permit rules.",
      "List all major allergens (nuts, dairy, gluten, etc.) in your description.",
      "Only tick dietary markers that are true for everything in the listing. \"Gluten-free\" and \"Nut-free\" mean no cross-contact in your kitchen, not just no gluten or nut ingredients.",
      "Selling food as \"Organic\" requires USDA organic certification once your organic sales pass $5,000 a year, and only certified sellers may use the USDA seal.",
    ],
    buyer:
      "Home-cooked food may not come from an inspected commercial kitchen. Dietary markers (vegan, gluten-free, organic, halal…) are the seller's own claims and aren't verified by DesiBazaar. If you have an allergy, confirm ingredients and kitchen practices with the seller.",
  },
  TUTORING: {
    seller: ["You are responsible for the safety of minors in your care and any background checks your state requires."],
  },
  DANCE_MUSIC: {
    seller: ["You are responsible for the safety of minors in your care and any background checks your state requires."],
  },
  DOMESTIC_HELP: {
    requiresReview: true,
    seller: [
      "You are an independent worker or agency, not an employee or agent of DesiBazaar.",
      "You are responsible for your own work authorization, taxes, licenses and insurance.",
    ],
    buyer:
      "DesiBazaar does not screen, employ or background-check anyone listed here. Run your own background check and check references. " +
      "If you hire someone, you may have employer obligations (taxes, minimum wage, work authorization) under federal and state law.",
  },
  ROOM_RENTAL: {
    requiresReview: true,
    seller: [
      "Under the federal Fair Housing Act and state laws, ads may not state a preference or limit based on race, color, religion, national origin, sex, disability or familial status. Do not write phrases like \"Indians only\", \"Hindus preferred\" or \"no kids\".",
      "Describe the room, not the person you want. You may describe house rules that apply to everyone (e.g. \"no smoking\", \"no pets\").",
      "You must own the property or have the right to rent it out, and follow local rental and registration rules.",
    ],
    buyer:
      "Visit the property and confirm the person renting it has the right to do so before paying anything. Never wire a deposit for a place you haven't seen.",
  },
};

export const REPORT_REASONS = [
  { id: "SCAM", label: "Scam or fraud" },
  { id: "DISCRIMINATION", label: "Discriminatory wording" },
  { id: "ILLEGAL", label: "Illegal item or service" },
  { id: "SAFETY", label: "Safety concern" },
  { id: "MISLEADING", label: "Misleading or wrong information" },
  { id: "COPYRIGHT", label: "Uses my photos, text or trademark" },
  { id: "OTHER", label: "Something else" },
] as const;

export function reportReasonLabel(id: string) {
  return REPORT_REASONS.find((r) => r.id === id)?.label ?? id;
}

// Shown to organizers when they post an event.
export const EVENT_RULES = [
  "Event details must be accurate: date, venue, price, performers. Update or hide the event if anything changes or it's cancelled.",
  "You're responsible for venue permits, insurance, food permits, and licenses for any alcohol, raffles or fireworks.",
  "Public events can't turn people away based on race, religion, national origin, sex or disability. Don't write \"Indians only\" or similar.",
  "You handle tickets, refunds and attendee safety. DesiBazaar doesn't sell tickets or run events.",
];

export const EVENT_DISCLAIMER =
  "Events are organized by independent organizers, not DesiBazaar. We don't sell tickets, verify performers or guarantee that an event happens. Check the organizer's details before buying tickets.";
