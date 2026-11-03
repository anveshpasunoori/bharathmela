// Listing search tuned for how people type desi terms: spelling variants
// (biriyani/biryani, pooja/puja), synonyms (meal box → tiffin), plurals, typos,
// half-typed words, "under $20" price limits and diet words. Runs in memory over
// one city's listings, which keeps it database-agnostic; move to a search index
// (Postgres full-text, Meilisearch) if a city grows past tens of thousands of listings.

import { DIET_TAGS, categoryLabel } from "./constants";

// Each group is a set of words people use for the same thing. The first entry is the canonical form.
const SYNONYMS: string[][] = [
  // Food
  ["biryani", "biriyani", "briyani", "biriani", "biryanee", "dum biryani"],
  ["tiffin", "meal box", "dabba", "lunch box", "lunchbox", "meal plan", "meal subscription", "home meals", "thali"],
  ["dosa", "dosai", "dosas"],
  ["idli", "idly", "idlies"],
  ["pickle", "achar", "achaar", "avakaya", "aavakaya", "pachadi"],
  ["sweets", "mithai", "dessert", "desserts"],
  ["laddu", "ladoo", "laddoo", "ladu", "laddus"],
  ["chai", "tea"],
  ["roti", "chapati", "chapathi", "phulka", "paratha", "parotta"],
  ["curry", "sabzi", "sabji", "subzi", "kura"],
  ["snacks", "namkeen", "chakli", "murukku", "mixture"],
  ["catering", "party order", "party orders", "bulk order", "trays"],
  ["home food", "homemade", "home cooked", "home-cooked", "ghar ka khana"],
  // Diet
  ["nonveg", "non veg", "non-veg", "non vegetarian", "non-vegetarian", "meat"],
  ["vegetarian", "veg", "veggie", "pure veg", "shakahari"],
  ["glutenfree", "gluten free", "gluten-free", "gf", "no gluten"],
  ["dairyfree", "dairy free", "dairy-free", "no dairy", "lactose free"],
  ["nutfree", "nut free", "nut-free", "no nuts"],
  ["eggless", "egg free", "egg-free", "no egg", "no eggs"],
  ["jain", "no onion no garlic", "no onion garlic", "satvik", "sattvic"],
  // Pujari
  ["puja", "pooja", "poojas", "pujas", "pooja services"],
  ["pujari", "priest", "pandit", "panditji", "purohit", "poojari", "pujari services", "guruji", "shastri"],
  ["homam", "havan", "hawan", "yagna", "yagam", "homa"],
  ["griha pravesh", "gruhapravesam", "gruha pravesam", "housewarming", "house warming", "grihapravesh"],
  ["satyanarayan", "satyanarayana", "sathyanarayana", "satyanarayan katha", "vratham", "vratam"],
  ["wedding", "marriage", "vivah", "kalyanam", "shaadi"],
  // Festivals and events
  ["diwali", "deepavali", "divali", "deepawali", "dipawali"],
  ["navratri", "navaratri", "garba", "dandiya", "dandiya raas", "raas garba"],
  ["ganesh", "ganesha", "ganpati", "ganapati", "vinayaka", "vinayaka chavithi", "ganesh chaturthi"],
  ["sankranti", "sankranthi", "pongal", "lohri", "makar sankranti", "bhogi"],
  ["ugadi", "yugadi", "gudi padwa"],
  ["holi", "rang panchami", "color festival", "festival of colors"],
  ["durga", "durga puja", "pujo", "durgotsav"],
  ["concert", "kutcheri", "katcheri", "recital", "live music", "performance"],
  ["mela", "fair", "festival fair", "bazaar", "utsav"],
  // Dance & music
  ["bharatanatyam", "bharathanatyam", "bharatnatyam", "bharatnatyam", "bharata natyam", "baratanatyam"],
  ["kuchipudi", "kuchipudi dance"],
  ["kathak", "katthak"],
  ["carnatic", "karnatic", "karnataka music", "carnatic music"],
  ["hindustani", "hindustani music", "hindustani classical"],
  ["music", "sangeetham", "sangeetam", "singing", "vocal", "vocals", "voice lessons"],
  ["dance", "dancing", "nritya", "natyam"],
  ["bollywood", "bollywood dance", "filmy dance"],
  ["veena", "vina"],
  ["mridangam", "mrudangam", "mridangam classes"],
  // Tutoring
  ["tutor", "tutoring", "tuition", "tuitions", "coaching", "home tutor", "private tutor"],
  ["class", "classes", "lessons", "lesson", "course", "courses", "workshop", "batch", "training"],
  ["teacher", "teaching", "instructor", "guru", "master", "trainer"],
  ["math", "maths", "mathematics", "algebra", "geometry", "calculus", "kumon"],
  ["coding", "programming", "computer science", "python", "java", "scratch"],
  ["sat", "act", "psat", "test prep", "exam prep"],
  // Domestic help
  ["nanny", "babysitter", "baby sitter", "babysitting", "ayah", "aaya", "childcare", "child care"],
  ["maid", "housekeeper", "housekeeping", "cleaning", "cleaner", "house cleaning", "bai"],
  ["caregiver", "elder care", "eldercare", "senior care", "attendant"],
  ["cook", "chef", "home cook", "cooking"],
  // Wedding and event vendors
  ["photographer", "photography", "photo shoot", "photoshoot", "candid", "pre wedding shoot", "prewedding", "maternity shoot"],
  ["videographer", "videography", "cinematographer", "wedding film", "wedding video", "drone"],
  ["dj", "deejay", "disc jockey", "baraat dj", "sound system"],
  ["bartender", "bartending", "bar service", "mixologist", "barback"],
  ["decorator", "decor", "decoration", "decorations", "mandap", "stage decor", "floral", "flowers", "balloon", "balloons"],
  ["makeup", "makeup artist", "mua", "bridal makeup", "hair stylist", "saree draping"],
  ["dhol", "dholi", "dhol player", "dhol wala", "nagada"],
  ["emcee", "mc", "anchor", "master of ceremonies"],
  ["choreographer", "choreography", "sangeet dance", "dance practice"],
  ["planner", "wedding planner", "event planner", "coordinator", "event management"],
  ["photo booth", "photobooth", "360 booth", "selfie booth"],
  ["party rentals", "party rental", "event rentals", "tent", "tents", "canopy", "chairs", "tables", "linens", "bounce house", "bouncy castle", "inflatable", "jhoola", "jhula", "swing"],
  ["haldi", "pellikoothuru", "mangala snanam"],
  ["sangeet", "sangeeth", "garba night"],
  ["baby shower", "seemantham", "godh bharai", "valaikaapu"],
  // Realtors and lawyers
  ["realtor", "real estate agent", "realty", "real estate", "broker", "listing agent", "buyers agent", "realtors"],
  ["buy home", "buy a home", "buy house", "home buying", "house hunting", "first home"],
  ["sell home", "sell my home", "sell house", "home selling", "list my house"],
  ["lawyer", "attorney", "advocate", "counsel", "law firm", "legal", "lawyers", "attorneys"],
  ["immigration", "h1b", "h-1b", "green card", "citizenship", "naturalization", "visa", "eb2", "eb3", "perm labor"],
  ["divorce", "family law", "custody", "separation"],
  ["wills", "estate planning", "probate", "living trust", "make a will", "write a will"],
  ["llc", "incorporation", "business formation", "contracts", "startup"],
  ["nri", "india property", "power of attorney", "poa", "oci"],
  // Rentals
  ["room", "rooms", "bedroom", "private room", "shared room"],
  ["rent", "rental", "for rent", "lease", "sublet", "sublease", "renting"],
  ["roommate", "room mate", "flatmate", "housemate"],
  ["apartment", "apt", "flat", "condo", "studio"],
  ["pg", "paying guest", "paying guests", "pg accommodation"],
  ["wifi", "wi fi", "wi-fi", "internet"],
  ["furnished", "fully furnished"],
  ["private bath", "attached bath", "attached bathroom", "private bathroom", "ensuite"],
  // Art & clothing
  ["mehndi", "mehendi", "henna", "mehandi"],
  ["rangoli", "kolam", "muggulu"],
  ["painting", "paintings", "art", "artwork", "canvas"],
  ["saree", "sari", "sarees", "saris"],
  ["lehenga", "lehnga", "lengha", "ghagra", "chaniya choli"],
  ["kurta", "kurti", "kurtis", "salwar", "salwar kameez", "churidar", "anarkali"],
  ["jewelry", "jewellery", "jewels", "bangles", "earrings", "necklace", "jhumka", "jhumkas"],
  ["blouse", "blouses", "blouse stitching"],
  ["tailor", "tailoring", "stitching", "alterations", "alteration"],
  // Home services, auto, beauty, tax and travel.
  ["plumber", "plumbers", "plumbing", "leak", "leaking", "clogged", "drain"],
  ["electrician", "electricians", "electrical", "wiring"],
  ["hvac", "air conditioning", "ac repair", "furnace", "heating repair"],
  ["handyman", "handymen", "odd jobs"],
  ["pest control", "termite", "termites", "exterminator", "pests"],
  ["movers", "packers", "packers and movers", "moving company"],
  ["lawn", "lawn care", "mowing", "landscaping", "landscaper", "yard work"],
  ["mechanic", "mechanics", "auto repair", "car repair"],
  ["driving lessons", "driving school", "driving instructor", "learn to drive"],
  ["threading", "eyebrow", "eyebrows", "eyebrow threading"],
  ["accountant", "cpa", "enrolled agent", "tax preparer", "tax filing", "tax return", "taxes"],
  ["flight", "flights", "air tickets", "airfare", "plane tickets"],
  ["notary", "apostille", "notarize", "notarization"],
  ["garage sale", "garage sales", "yard sale", "yard sales", "moving sale", "moving out sale", "estate sale", "rummage sale", "moving out"],
];

// Words that hint at a category: they rank that category higher, and a search that clearly belongs to
// another category moves the visitor there. A word can hint at several ("wedding": pujaris and event vendors).
const CATEGORY_HINTS: Record<string, string[]> = {
  FOOD: ["food", "cook", "tiffin", "biryani", "dosa", "idli", "pickle", "sweets", "laddu", "snacks", "catering", "curry", "roti", "chai", "samosa", "paneer", "meal", "kitchen", "home food"],
  TUTORING: ["tutor", "math", "coding", "sat", "science", "english", "homework", "reading", "physics", "chemistry"],
  DANCE_MUSIC: ["dance", "music", "bharatanatyam", "kuchipudi", "kathak", "carnatic", "hindustani", "bollywood", "veena", "mridangam", "tabla", "violin", "flute", "harmonium", "keyboard", "guitar"],
  PUJARI: ["puja", "pujari", "homam", "griha pravesh", "satyanarayan", "wedding", "temple", "astrology", "jathakam", "muhurtham"],
  DOMESTIC_HELP: ["nanny", "maid", "caregiver", "cook", "help", "helper"],
  ROOM_RENTAL: ["room", "rent", "roommate", "apartment"],
  REALTOR: ["realtor", "buy home", "sell home"],
  EVENT_SERVICES: ["photographer", "videographer", "dj", "bartender", "decorator", "makeup", "dhol", "emcee", "choreographer", "planner", "photo booth", "party rentals", "wedding", "sangeet", "mehndi", "decor", "catering", "cake"],
  LEGAL: ["lawyer", "immigration", "divorce", "wills", "llc", "nri"],
  HOME_SERVICES: ["plumber", "electrician", "hvac", "handyman", "painter", "painting", "roofing", "gutters", "pest control", "movers", "lawn", "remodeling", "renovation", "appliance repair", "contractor"],
  AUTO: ["mechanic", "car", "auto", "oil change", "tires", "detailing", "body shop", "driving lessons"],
  BEAUTY: ["threading", "waxing", "salon", "haircut", "beauty", "bridal makeup", "makeup", "mehndi", "saree draping", "yoga", "fitness", "trainer"],
  TAX_FINANCE: ["accountant", "itin", "fbar", "bookkeeping", "insurance", "payroll"],
  GARAGE_SALE: ["garage sale", "secondhand", "used furniture"],
  TRAVEL: ["flight", "travel", "travel agent", "tour", "tours", "notary", "travel companion"],
  ART: ["painting", "rangoli", "mehndi", "craft", "crafts", "decor", "art", "madhubani", "tanjore", "warli"],
  CLOTHING: ["saree", "lehenga", "kurta", "jewelry", "blouse", "tailor", "clothes", "dress", "dresses"],
};

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "from", "with", "by", "near", "me", "my", "i",
  "we", "our", "you", "your", "is", "are", "am", "be", "best", "good", "great", "top", "cheap", "affordable",
  "looking", "need", "needed", "want", "wanted", "find", "any", "some", "please", "pls", "around", "area", "local",
  "nearby", "available", "service", "services", "someone", "who", "can", "get", "buy", "order",
]);

const DIET_TOKENS: Record<string, string> = {
  VEGETARIAN: "vegetarian",
  VEGAN: "vegan",
  JAIN: "jain",
  EGGLESS: "eggless",
  GLUTEN_FREE: "glutenfree",
  DAIRY_FREE: "dairyfree",
  NUT_FREE: "nutfree",
  ORGANIC: "organic",
  HALAL: "halal",
};

// ---------- text processing ----------

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9$<\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Light suffix stripping so "classes"/"class", "dancing"/"dance", "pickles"/"pickle" meet.
export function stem(word: string) {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (/(ss|x|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) w = w.slice(0, -1);
  if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("e") && w.length > 3) w = w.slice(0, -1);
  return w;
}

// Multi-word phrases become single tokens ("meal box" → "tiffin", "gluten free" → "glutenfree").
const PHRASES: [RegExp, string][] = SYNONYMS.flatMap((group) =>
  group
    .filter((w) => w.includes(" ") || w.includes("-"))
    .map((w) => [new RegExp(`\\b${normalize(w).replace(/ /g, "\\s+")}\\b`, "g"), group[0].replace(/ /g, "")] as [RegExp, string]),
).sort((a, b) => b[0].source.length - a[0].source.length);

// Queries replace a phrase with its token; listings keep the original words too, so
// "Carnatic music" still matches a search for "music".
function collapsePhrases(text: string, keepWords: boolean) {
  let t = text;
  for (const [re, token] of PHRASES) t = t.replace(re, (m) => (keepWords ? `${token} ${m}` : token));
  return t;
}

function tokenize(text: string, keepWords = false) {
  return collapsePhrases(normalize(text), keepWords).split(" ").filter(Boolean);
}

// Word → canonical stem of its synonym group.
const CANONICAL = new Map<string, string>();
for (const group of SYNONYMS) {
  const canon = stem(group[0].replace(/ /g, ""));
  for (const w of group) for (const t of tokenize(w)) CANONICAL.set(stem(t), canon);
  CANONICAL.set(stem(group[0].replace(/ /g, "")), canon);
}
const canonical = (s: string) => CANONICAL.get(s) ?? s;

// Words that mean something else inside a category: "rentals" in an event vendor's ad means
// party rentals, not housing. Applied to those listings, and to queries hinting at that category.
const CATEGORY_CANON: Record<string, Map<string, string>> = {
  EVENT_SERVICES: new Map([[canonical(stem("rent")), canonical(stem("partyrentals"))]]),
};
const canonIn = (category: string, canon: string) => CATEGORY_CANON[category]?.get(canon) ?? canon;

const HINT_INDEX = new Map<string, string[]>();
for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
  for (const w of words) {
    const canon = canonical(stem(w.replace(/ /g, "")));
    const cats = HINT_INDEX.get(canon) ?? [];
    if (!cats.includes(cat)) HINT_INDEX.set(canon, [...cats, cat]);
  }
}

// Damerau-Levenshtein distance with an early exit once it passes `max`.
export function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = cur;
  }
  return prev[b.length];
}

const typoBudget = (len: number) => (len >= 8 ? 2 : len >= 5 ? 1 : 0);

// ---------- query parsing ----------

export type ParsedQuery = {
  terms: { raw: string; stem: string; canon: string }[];
  maxPriceCents?: number;
  minPriceCents?: number;
  hintedCategory?: string;
  // How many query words point at each category.
  categoryHints: Map<string, number>;
};

// `browsing` is the category the visitor is in; it wins ties, so "wedding" in event services stays there.
export function parseQuery(query: string, browsing?: string): ParsedQuery {
  let q = normalize(query);
  let maxPriceCents: number | undefined;
  let minPriceCents: number | undefined;

  const under = q.match(/\b(?:under|below|less than|cheaper than|upto|up to|max|within|<)\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (under) {
    maxPriceCents = Math.round(Number(under[1]) * 100);
    q = q.replace(under[0], " ");
  }
  const over = q.match(/\b(?:over|above|more than|at least|min)\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (over) {
    minPriceCents = Math.round(Number(over[1]) * 100);
    q = q.replace(over[0], " ");
  }
  q = q.replace(/\$\s*\d+(\.\d+)?/g, " ");

  const words = tokenize(q).filter((w) => !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  const seen = new Set<string>();
  const terms: ParsedQuery["terms"] = [];
  for (const raw of words) {
    const s = stem(raw);
    const canon = canonical(s);
    if (seen.has(canon)) continue;
    seen.add(canon);
    terms.push({ raw, stem: s, canon });
  }
  const categoryHints = new Map<string, number>();
  for (const t of terms) for (const cat of HINT_INDEX.get(t.canon) ?? []) categoryHints.set(cat, (categoryHints.get(cat) ?? 0) + 1);
  // The most-hinted category; ties go to the one being browsed, then to the earliest word's.
  let hintedCategory: string | undefined;
  for (const [cat, n] of categoryHints) {
    const best = hintedCategory ? categoryHints.get(hintedCategory)! : 0;
    if (n > best || (n === best && cat === browsing)) hintedCategory = cat;
  }
  if (hintedCategory) for (const t of terms) t.canon = canonIn(hintedCategory, t.canon);
  return { terms: terms.slice(0, 8), maxPriceCents, minPriceCents, hintedCategory, categoryHints };
}

// Categories a search clearly belongs to instead of `current`: those its words point at more than at
// `current`, best first. Empty when the words fit `current` at least as well, or point nowhere.
export function betterCategories(query: ParsedQuery, current: string) {
  const here = query.categoryHints.get(current) ?? 0;
  const top = Math.max(0, ...query.categoryHints.values());
  if (top <= here) return [];
  return [...query.categoryHints].filter(([, n]) => n === top).map(([cat]) => cat);
}

// ---------- matching and ranking ----------

export type Searchable = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  priceUnit: string;
  tags: string;
  vendor: { businessName: string };
};

const FIELD_WEIGHTS = { title: 3, tags: 2.5, business: 2, category: 1.5, description: 1, unit: 0.5 } as const;
type Field = keyof typeof FIELD_WEIGHTS;

type DocIndex = { fields: { field: Field; stems: string[]; canons: Set<string> }[]; words: string[] };

function indexDoc(doc: Searchable): DocIndex {
  const tagText = DIET_TAGS.filter((t) => doc.tags.includes(`,${t.id},`)).map((t) => DIET_TOKENS[t.id]).join(" ");
  const raw: [Field, string][] = [
    ["title", doc.title],
    ["tags", tagText],
    ["business", doc.vendor.businessName],
    ["category", categoryLabel(doc.category)],
    ["description", doc.description],
    ["unit", doc.priceUnit],
  ];
  const words: string[] = [];
  const fields = raw.map(([field, text]) => {
    const tokens = tokenize(text, true);
    words.push(...tokens);
    const stems = tokens.map(stem);
    return { field, stems, canons: new Set(stems.map((x) => canonIn(doc.category, canonical(x)))) };
  });
  return { fields, words };
}

// How well one query term matches one field: 1 exact, then synonym, prefix and typo matches.
function termFieldScore(term: ParsedQuery["terms"][number], f: DocIndex["fields"][number]) {
  if (f.stems.includes(term.stem)) return 1;
  if (f.canons.has(term.canon)) return 0.9;
  let best = 0;
  const budget = typoBudget(term.stem.length);
  for (const s of f.stems) {
    if (term.stem.length >= 4 && s.length > term.stem.length && s.startsWith(term.stem)) best = Math.max(best, 0.7);
    else if (budget && s.length >= 4 && editDistance(term.stem, s, budget) <= budget) best = Math.max(best, 0.6);
    if (best >= 0.7) break;
  }
  return best;
}

export type Ranked<T> = { item: T; score: number };

export function rankListings<T extends Searchable>(query: ParsedQuery, docs: T[]): Ranked<T>[] {
  const results: Ranked<T>[] = [];
  for (const doc of docs) {
    if (query.maxPriceCents != null && (doc.priceCents == null || doc.priceCents > query.maxPriceCents)) continue;
    if (query.minPriceCents != null && (doc.priceCents == null || doc.priceCents < query.minPriceCents)) continue;
    if (!query.terms.length) {
      results.push({ item: doc, score: 0 });
      continue;
    }
    const index = indexDoc(doc);
    let score = 0;
    let matched = 0;
    for (const term of query.terms) {
      let best = 0;
      for (const f of index.fields) best = Math.max(best, termFieldScore(term, f) * FIELD_WEIGHTS[f.field]);
      if (best > 0) matched++;
      score += best;
    }
    // Most of the words must match; a listing matching every word ranks well above partial matches.
    const coverage = matched / query.terms.length;
    if (coverage < (query.terms.length <= 2 ? 1 : 0.6)) continue;
    score *= coverage * coverage;
    if (query.hintedCategory && doc.category === query.hintedCategory) score *= 1.25;
    results.push({ item: doc, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

// Suggests a corrected query from words that actually appear in listings, for "Did you mean".
export function suggestQuery(query: ParsedQuery, docs: Searchable[]): string | null {
  const vocab = new Set<string>();
  for (const d of docs) for (const w of indexDoc(d).words) if (w.length >= 3 && !/^\d/.test(w)) vocab.add(w);
  let changed = false;
  const words = query.terms.map((t) => {
    if ([...vocab].some((v) => stem(v) === t.stem || canonical(stem(v)) === t.canon)) return t.raw;
    const budget = Math.max(1, typoBudget(t.raw.length));
    let best: string | null = null;
    let bestDist = budget + 1;
    for (const v of vocab) {
      const d = editDistance(t.raw, v, budget);
      if (d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    if (best) {
      changed = true;
      return best;
    }
    return t.raw;
  });
  return changed ? words.join(" ") : null;
}
