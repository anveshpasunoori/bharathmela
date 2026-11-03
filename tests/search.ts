// Run with `npm test`. Each case: query, listing ids that must appear (first = top result), ids that must not.
import { betterCategories, parseQuery, rankListings, suggestQuery, type Searchable } from "../src/lib/search";
const L = (id: string, category: string, title: string, description: string, priceCents: number | null, priceUnit = "", tags = "", biz = "Seller"): Searchable =>
  ({ id, title, description, category, priceCents, priceUnit, tags, vendor: { businessName: biz } });
const docs = [
  L("mealbox", "FOOD", "Weekly Andhra meal box (5 days)", "Home-style rice, dal, curry, pickle and curd. Pickup in Santa Clara.", 7500, "per week", ",VEGETARIAN,EGGLESS,NUT_FREE,", "Lakshmi's Andhra Kitchen"),
  L("biryani", "FOOD", "Party orders – biryani trays", "Chicken or veg dum biryani. Order 3 days ahead.", 9000, "per tray", "", "Lakshmi's Andhra Kitchen"),
  L("laddu", "FOOD", "Vegan millet laddus and snacks", "Ragi and jowar laddus sweetened with jaggery, made in a gluten-free home kitchen.", 1500, "per box", ",VEGETARIAN,VEGAN,EGGLESS,GLUTEN_FREE,DAIRY_FREE,"),
  L("dance", "DANCE_MUSIC", "Bharatanatyam & Carnatic vocal classes", "Weekly group classes for ages 6+ in West San Jose. Saturdays.", 12000, "per month", "", "Sruthi Laya Kala Kendra"),
  L("puja", "PUJARI", "Griha Pravesh & Satyanarayan Puja", "Telugu, Hindi and Sanskrit. Samagri list provided.", 25100, "per puja", "", "Pandit Ravi Sharma"),
  L("math", "TUTORING", "Kumon-style math tutoring, grades 1–8", "Small groups in Plano or online. Free trial class.", 3000, "per hour"),
  L("room", "ROOM_RENTAL", "Private room in 3BR house near Lawrence Expwy", "Furnished room with shared bath, utilities and Wi-Fi included.", 140000, "per month"),
  L("realtor", "REALTOR", "Your Bay Area home buying partner", "First-time buyers and relocations. Coldwell Banker. Hindi and Telugu.", null, "", "", "Priya Nair Realty"),
  L("lawyer", "LEGAL", "Immigration and family law attorney", "H-1B, green card, citizenship and divorce cases. Free consultation.", 25000, "per hour", "", "Rao Law"),
  L("photo", "EVENT_SERVICES", "Candid wedding photography & films", "Sangeet, haldi and wedding coverage across the Bay Area. Drone add-on.", 250000, "starting at", "", "Lens & Lights Studio"),
  L("rentals", "EVENT_SERVICES", "Party rentals: tents, mandap, jhoola & bounce houses", "Tables, chairs, linens, chafing dishes and kids' bounce houses. We deliver and set up.", 20000, "starting at", "", "Utsav Rentals"),
  L("art", "ART", "Madhubani paintings on canvas", "Hand-painted Madhubani art. Custom orders welcome.", 8500, "per painting"),
];
const cases: [string, string[], string[]?][] = [
  ["biriyani", ["biryani"]],
  ["briyani near me", ["biryani"]],
  ["tiffin service", ["mealbox"]],
  ["lunch box", ["mealbox"]],
  ["pooja", ["puja"]],
  ["priest for housewarming", ["puja"]],
  ["gruhapravesam", ["puja"]],
  ["bharathanatyam classes", ["dance"]],
  ["bharatnatym", ["dance"]],
  ["bhar", ["dance"]],
  ["carnatic music", ["dance"]],
  ["singing lessons", ["dance"]],
  ["maths tutor", ["math"]],
  ["kumon", ["math"]],
  ["tutor", ["math"], ["dance"]],
  ["SAT prep", [], ["dance"]],
  ["gluten free snacks", ["laddu"]],
  ["vegan", ["laddu"]],
  ["veg food", ["mealbox"]],
  ["ladoo", ["laddu"]],
  ["room for rent", ["room"]],
  ["sublet", ["room"]],
  ["painting", ["art"]],
  ["food under $20", ["laddu"], ["mealbox", "biryani"]],
  ["pickles", ["mealbox"]],
  ["lakshmi", ["mealbox", "biryani"]],
  ["xyzzy", []],
  ["real estate agent", ["realtor"]],
  ["buy a home", ["realtor"]],
  ["attorney", ["lawyer"]],
  ["green card lawyer", ["lawyer"]],
  ["h1b", ["lawyer"]],
  ["estate planning", [], ["laddu", "mealbox", "dance"]],
  ["wedding photographer", ["photo"]],
  ["videographer", ["photo"], ["lawyer"]],
  ["bouncy castle", ["rentals"]],
  ["jhula rental", ["rentals"]],
  ["tent for party", ["rentals"]],
  ["room for rent", ["room"], ["rentals"]],
];
let fail = 0;
for (const [q, mustInclude, mustExclude = []] of cases) {
  const pq = parseQuery(q);
  const ids = rankListings(pq, docs).map((r) => r.item.id);
  const ok = mustInclude.every((id) => ids.includes(id)) && mustExclude.every((id) => !ids.includes(id)) && (mustInclude.length ? ids[0] === mustInclude[0] || mustInclude.includes(ids[0]) : true);
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", JSON.stringify(q).padEnd(28), "->", ids.join(", ") || "(none)", pq.hintedCategory ? `[hint ${pq.hintedCategory}]` : "");
}
// Searching inside a category for something that belongs elsewhere: where the words point instead of here.
const moves: [string, string, string[]][] = [
  ["pujari", "FOOD", ["PUJARI"]],
  ["biryani", "TUTORING", ["FOOD"]],
  ["math tutor", "DANCE_MUSIC", ["TUTORING"]],
  ["room for rent", "EVENT_SERVICES", ["ROOM_RENTAL"]],
  ["immigration lawyer", "REALTOR", ["LEGAL"]],
  ["saree", "ART", ["CLOTHING"]],
  ["wedding photographer", "FOOD", ["EVENT_SERVICES"]],
  ["wedding", "FOOD", ["PUJARI", "EVENT_SERVICES"]], // ambiguous: decided by where the listings are
  ["wedding", "EVENT_SERVICES", []], // fits here too, so stay
  ["mehndi", "ART", []],
  ["tent rental", "EVENT_SERVICES", []],
  ["vegan", "FOOD", []],
  ["xyzzy", "FOOD", []], // no hint words: decided by where the listings are
];
for (const [q, current, want] of moves) {
  const got = betterCategories(parseQuery(q, current), current);
  const ok = JSON.stringify([...got].sort()) === JSON.stringify([...want].sort());
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", `${JSON.stringify(q)} in ${current}`.padEnd(40), "->", got.join(", ") || "(stay)");
}
for (const q of ["biriyaani", "bharatnatyam clases", "madubani", "pandit"]) console.log("suggest", q, "->", suggestQuery(parseQuery(q), docs));
console.log(fail ? `${fail} failed` : "all passed");
if (fail) process.exit(1);
