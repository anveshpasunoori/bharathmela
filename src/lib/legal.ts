// Platform-liability text shown across the app. Have a lawyer review before launch.

// Bump when the Terms change materially; sellers who accepted an older version can be re-prompted.
export const TERMS_VERSION = "2026-11-02";

export const SITE_NAME = "BharathMela";

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
      "Home-cooked food may not come from an inspected commercial kitchen. Dietary markers (vegan, gluten-free, organic, halal…) are the seller's own claims and aren't verified by BharathMela. If you have an allergy, confirm ingredients and kitchen practices with the seller.",
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
      "You are an independent worker or agency, not an employee or agent of BharathMela.",
      "You are responsible for your own work authorization, taxes, licenses and insurance.",
    ],
    buyer:
      "BharathMela does not screen, employ or background-check anyone listed here. Run your own background check and check references. " +
      "If you hire someone, you may have employer obligations (taxes, minimum wage, work authorization) under federal and state law.",
  },
  EVENT_SERVICES: {
    seller: [
      "Show only photos and videos of your own work, and get permission from the people in them before posting.",
      "Bartenders: serve only alcohol the host provides, only to guests 21 and over, and follow your state's server-certification rules. Selling or supplying alcohol requires a liquor or caterer's license.",
      "Many venues require vendors to carry liability insurance. Only mark yourself as insured if you have a current policy.",
      "Party rentals: inspect items before each event, and state the damage deposit, late-return and cleaning fees in your rental agreement. Bounce houses must be insured and set up and anchored by trained staff.",
      "Put prices, deposits, cancellation terms and what's included in a written contract with your client.",
    ],
    buyer:
      "Get a written contract with the date, hours, what's included, deposit and cancellation terms. Ask for references and, if your venue needs it, a certificate of insurance. Pay deposits by a method you can dispute, like a credit card, and never pay in full far in advance. For rentals, photograph items at delivery and get the damage-deposit terms in writing.",
  },
  REALTOR: {
    requiresReview: true,
    seller: [
      "You must hold an active real estate license in the state where you work, and list your license number and supervising brokerage. Many states require both in every ad.",
      "Fair housing law applies to you as an agent: don't describe or steer buyers toward neighborhoods by religion, national origin or community (\"Indian neighborhood\", \"desi area\"). Describe homes, schools and commutes instead.",
      "Don't promise results (\"guaranteed sale in 7 days\") or advertise rebates or commissions where your state restricts them.",
    ],
    buyer:
      "Check the agent's license with your state's real estate department before signing anything. BharathMela checks that a license number was provided but doesn't guarantee it's current or in good standing. Never wire earnest money without calling the title or escrow company at a number you looked up yourself.",
  },
  LEGAL: {
    requiresReview: true,
    seller: [
      "Only lawyers licensed in a US state may offer legal services here. List your bar number and state; listings are checked before going live.",
      "Follow your state bar's advertising rules: no guarantees of outcomes, no misleading claims, and only say \"certified specialist\" if a recognized body has certified you.",
      "Immigration help must come from a lawyer or a DOJ-accredited representative. \"Notario\" and \"immigration consultant\" offers of legal advice aren't allowed.",
      "You're responsible for your own conflict checks, engagement letters and client trust accounts.",
    ],
    buyer:
      "Check the lawyer's license with the state bar before hiring. Contacting a lawyer through BharathMela doesn't create an attorney-client relationship, and what you send isn't confidential until you've hired them. Beware of anyone who guarantees a visa, green card or court result.",
  },
  HOME_SERVICES: {
    seller: [
      "Most states and many cities require a contractor's license for electrical, plumbing, HVAC, roofing and remodeling work, and permits for many jobs. Only offer work you're licensed for, and put your license number in your description.",
      "Pest control needs a state pesticide applicator license. Movers crossing state lines need a USDOT number.",
      "Only say you're insured or bonded if you have a current policy, and give clients a written estimate before you start.",
    ],
    buyer:
      "Check the contractor's license with your state's licensing board, ask for proof of insurance, and get a written estimate. Don't pay most of the price up front; pay by a method you can dispute, and pay the balance when the work passes inspection.",
  },
  AUTO: {
    seller: [
      "Follow your state's rules for auto repair shops (many require registration and written estimates) and for disposing of oil, tires and fluids.",
      "Driving instructors must be licensed by the state and use a properly insured vehicle; many states require a dual-control car.",
    ],
    buyer:
      "Get a written estimate before any repair, ask for your old parts back, and keep receipts. For driving lessons, ask to see the instructor's state license and insurance.",
  },
  BEAUTY: {
    seller: [
      "Cosmetology, threading and waxing work usually needs a state license, and home salons may need a salon permit. Follow your state's hygiene rules: clean tools and single-use supplies.",
      "Mehndi: use natural henna only. \"Black henna\" (PPD) causes serious skin reactions and isn't allowed.",
      "Yoga and fitness: don't claim to treat or cure medical conditions.",
    ],
    buyer:
      "Ask about the provider's license and hygiene practices, and do a patch test before henna or new products if you have sensitive skin.",
  },
  TAX_FINANCE: {
    requiresReview: true,
    seller: [
      "Anyone paid to prepare federal tax returns must have an IRS PTIN. Say whether you're a CPA, an Enrolled Agent or a tax preparer, and only use \"CPA\" if you hold an active state license.",
      "ITIN help must come from an IRS Certifying Acceptance Agent if you certify documents.",
      "Insurance agents must be licensed in the client's state; list your license number. Don't give investment advice unless you're registered to.",
      "Never promise a refund amount, and never have refunds deposited to your own account.",
    ],
    buyer:
      "Ask for the preparer's PTIN and credentials, get a written fee quote, and never sign a blank return or let a refund go to the preparer's account. Check insurance agents' licenses with your state insurance department.",
  },
  TRAVEL: {
    seller: [
      "Travel sellers may need to register in their state (California, Florida, Hawaii and Washington require it) and keep client payments in a trust account.",
      "Don't give visa, OCI, passport or immigration advice beyond helping fill in forms; legal advice must come from a lawyer.",
      "Notaries must hold a current commission in their state. Travel companions arrange their own tickets and don't act as medical caregivers.",
    ],
    buyer:
      "Pay for tickets by credit card and check the booking directly with the airline before paying anything extra. For visa, OCI or passport questions, rely on the official consulate or government site.",
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
  { id: "PHOTO", label: "Inappropriate or stolen photo" },
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
  "You handle tickets, refunds and attendee safety. BharathMela doesn't sell tickets or run events.",
];

export const EVENT_DISCLAIMER =
  "Events are organized by independent organizers, not BharathMela. We don't sell tickets, verify performers or guarantee that an event happens. Check the organizer's details before buying tickets.";
