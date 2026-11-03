// Automatic screening of listing text before it goes live.
// "block" stops the seller from posting and tells them why; "flags" send the
// listing to the admin review queue instead of publishing it. Keyword rules
// catch the obvious cases; human review handles the rest.

// Groups protected under fair-housing and anti-discrimination law, plus common
// proxies for them in community ads (language, region, caste).
const PROTECTED = [
  "indians?", "desis?", "hindus?", "muslims?", "christians?", "sikhs?", "jains?", "buddhists?", "jews?|jewish",
  "telugus?", "tamils?|tamilians?", "gujaratis?", "punjabis?", "marathis?", "bengalis?", "malayalis?|keralites?",
  "kannadigas?", "south indians?", "north indians?", "pakistanis?", "bangladeshis?", "nepalis?", "sri lankans?",
  "americans?", "whites?", "blacks?", "asians?", "hispanics?|latinos?|latinas?", "brahmins?", "dalits?",
  "males?", "females?", "men", "women", "boys?", "girls?", "ladies", "gents", "bachelors?", "spinsters?",
  "married( couples?)?", "famil(y|ies)", "couples?", "citizens?", "green card holders?",
];
// Diet is a common stand-in for religion when describing who may rent or work in a home.
// Only checked for housing and hiring, since "pure veg only" is fine for a kitchen.
const DIET = ["vegetarians?", "veg", "non-?veg", "vegans?", "eggetarians?"];

// People nouns, so "only Indian spices" isn't caught but "only Indian tenants" is.
const PERSON =
  "tenants?|roommates?|room ?mates?|renters?|people|persons?|candidates?|applicants?|customers?|clients?|guys?|folks|" +
  "maids?|nann(y|ies)|cooks?|helpers?|caregivers?|workers?|ladies|lady|families|family|students?|professionals?|occupants?";

// In strict mode a few describing words may sit between the group and the person
// ("prefer Telugu vegetarian working professional").
function discriminationPatterns(terms: string[], strict: boolean): RegExp[] {
  const t = terms.join("|");
  const gap = strict ? "(\\s+[a-z-]+){0,3}?" : "";
  return [
    new RegExp(`\\b(${t})\\s+(only|preferred|wanted|required)\\b`, "i"),
    new RegExp(`\\b(only|prefer(?:red)?|must be|looking for|seeking|need|want)\\s+(an?\\s+)?(${t})${gap}\\s+(${PERSON})\\b`, "i"),
    new RegExp(`\\b(only|prefer(?:red)?|must be)\\s+(an?\\s+)?(${t})\\s*([.,;:!)]|$)`, "i"),
    /\bno\s+(kids|children|babies|families|pregnant|disabled|wheelchairs?|section 8|vouchers?|foreigners|immigrants)\b/i,
    /\b(caste|gotra|community)\s+(no bar|preferred|only|must)\b/i,
    /\b(same|our)\s+(caste|community|religion)\b/i,
  ];
}

const DISCRIMINATION = discriminationPatterns(PROTECTED, false);
const DISCRIMINATION_STRICT = discriminationPatterns([...PROTECTED, ...DIET], true);

const PROHIBITED: { pattern: RegExp; reason: string }[] = [
  { pattern: /(?<!(glue|toy|nerf|water|heat|spray|massage|squirt|nail|staple|caulk) )\b(guns?|firearms?|pistols?|rifles?|ammo|ammunition|silencers?)\b/i, reason: "weapons" },
  { pattern: /\b(weed|marijuana|cannabis|thc|edibles|psilocybin|mushrooms? (gummies|edibles)|kratom|cocaine|mdma|xanax|adderall|oxycodone|percocet)\b/i, reason: "drugs" },
  { pattern: /\b(prescription|rx)\s+(drugs?|medicines?|pills|tablets)\b/i, reason: "prescription drugs" },
  { pattern: /\b(liquor|alcohol|whisk(e)?y|vodka|rum|beer|wine|toddy|daru)\b.{0,30}\b(for sale|selling|sell|delivery|available)\b/i, reason: "alcohol sales" },
  { pattern: /\b(cigarettes?|vapes?|e-?cigs?|gutka|gutkha|paan masala|khaini|hookah tobacco)\b/i, reason: "tobacco or nicotine products" },
  { pattern: /\b(first copy|replica|duplicate brand|fake (brand|designer)|counterfeit|master copy|aaa quality)\b/i, reason: "counterfeit goods" },
  { pattern: /\b(escorts?|sugar (daddy|baby)|adult services|happy ending|nuru)\b/i, reason: "adult services" },
  { pattern: /\b(fireworks?|firecrackers?|sparklers? for sale)\b/i, reason: "fireworks" },
  { pattern: /\b(fake|novelty)\s+(ids?|licen[cs]es?|passports?|documents?|ssn|green cards?)\b/i, reason: "fake documents" },
  { pattern: /\b(h1b|h-1b|green card|visa)\s+(sponsorship )?for sale\b|\bsell(ing)? (h1b|visa|green card)/i, reason: "immigration fraud" },
];

const SUSPICIOUS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(western union|moneygram|wire transfer|wire the|bank transfer only)\b/i, reason: "asks for wire transfers" },
  { pattern: /\b(gift ?cards?|itunes cards?|google play cards?|steam cards?)\b/i, reason: "mentions gift cards" },
  { pattern: /\b(bitcoin|btc|crypto|usdt|ethereum)\b/i, reason: "mentions crypto payment" },
  { pattern: /\b(deposit|advance|pay)\b.{0,40}\b(before|without)\b.{0,20}\b(viewing|seeing|visit|meeting)\b/i, reason: "asks for payment before viewing" },
  { pattern: /\b(out of (the )?country|currently abroad|overseas owner|keys? (will be )?(mailed|shipped))\b/i, reason: "absentee-owner rental pattern" },
  { pattern: /\b(earn|make)\s+\$?\d[\d,]*\+?\s*(\/|per|a)\s*(day|week)\b|\b(join my team|be your own boss|passive income|mlm|network marketing|downline)\b/i, reason: "income or MLM pitch" },
  { pattern: /\b(guaranteed|100%)\s+(results|cure|returns|visa|job|admission|weight loss)\b/i, reason: "guarantee claim" },
  { pattern: /\b(cures?|treats?|heals?)\s+(cancer|diabetes|covid|hiv|autism|infertility)\b/i, reason: "medical cure claim" },
  { pattern: /\b(vashikaran|black magic|love spell|get your (ex|love) back|astrolog(y|er) .*guarantee)\b/i, reason: "spell or guaranteed-astrology pitch" },
  { pattern: /\b(massage)\b/i, reason: "massage services" },
  { pattern: /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ly|me|xyz|in)\b/i, reason: "contains a link" },
];

export type Screening = { block?: string; flags: string[] };

// Housing and hiring ads are where preference wording is clearly illegal, so it's
// blocked there. Elsewhere ("girls-only dance batch", "taught in Telugu only")
// it can be legitimate, so it goes to a human instead.
const STRICT_CATEGORIES = new Set(["ROOM_RENTAL", "DOMESTIC_HELP"]);

export function screenListing(text: string, category: string): Screening {
  const normalized = text.replace(/\s+/g, " ");
  const preferenceFlags: string[] = [];
  const strict = STRICT_CATEGORIES.has(category);
  for (const re of strict ? DISCRIMINATION_STRICT : DISCRIMINATION) {
    const m = normalized.match(re);
    if (!m) continue;
    if (strict) {
      return {
        block: `Your listing says "${m[0].trim()}". Rental and hiring ads can't state a preference about who the tenant or worker is (religion, community, language, sex, family status, diet and similar). Describe the room or the job instead.${category === "ROOM_RENTAL" ? " If you live in the home and will share it, you can set a roommate gender preference in the rental details instead." : ""}`,
        flags: [],
      };
    }
    preferenceFlags.push(`preference wording: "${m[0].trim()}"`);
    break;
  }
  for (const { pattern, reason } of PROHIBITED) {
    const m = normalized.match(pattern);
    if (m) return { block: `Listings for ${reason} aren't allowed on DesiBazaar (found "${m[0]}").`, flags: [] };
  }
  const flags = SUSPICIOUS.filter(({ pattern }) => pattern.test(normalized)).map((s) => s.reason);
  return { flags: [...preferenceFlags, ...flags] };
}

// Short checks for free-text fields that aren't listings (reviews, replies, business names).
export function screenShortText(text: string): string | null {
  if (/https?:\/\/|www\./i.test(text)) return "Links aren't allowed here.";
  if (/\b\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}\b/.test(text)) return "Please don't include phone numbers here.";
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) return "Please don't include email addresses here.";
  return null;
}
