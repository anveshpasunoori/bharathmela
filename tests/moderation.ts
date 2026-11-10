// Run with `npm test`. Each case: category, listing text, expected outcome (block / flag / ok; "?" = either).
import { screenListing } from "../src/lib/moderation";
const cases: [string, string, string][] = [
  ["ROOM_RENTAL", "Room in Fremont, prefer Telugu vegetarian working professional", "block"],
  ["ROOM_RENTAL", "Private room, Indians only, near BART", "block"],
  ["ROOM_RENTAL", "Spacious room. No kids please.", "block"],
  ["ROOM_RENTAL", "Looking for female roommate for 2BR", "block"],
  ["ROOM_RENTAL", "Room available, vegetarian only kitchen.", "block?"],
  ["ROOM_RENTAL", "Furnished room with shared bath, utilities included. No smoking, no pets.", "ok"],
  ["ROOM_RENTAL", "Owner is out of the country, keys will be mailed after deposit via Western Union", "flag"],
  ["FOOD", "We use only Indian spices. Pure veg only. Family recipes.", "ok"],
  ["FOOD", "Homemade biryani, $12 per plate, pickup in Plano", "ok"],
  ["DANCE_MUSIC", "Bharatanatyam classes, girls only batch on Saturdays", "flag"],
  ["TUTORING", "Telugu classes taught in Telugu only", "flag"],
  ["ART", "Handmade decor made with hot glue gun and recycled paper", "ok"],
  ["GOODS", "Diwali firecrackers available", "block"],
  ["CLOTHING", "First copy designer sarees", "block"],
  ["GOODS", "Earn $500 per day, join my team!", "flag"],
  ["PUJARI", "Brahmin priest for all pujas, Telugu and Sanskrit", "ok"],
  ["DOMESTIC_HELP", "Need a Hindu cook for our home", "block"],
  ["DOMESTIC_HELP", "Experienced nanny, 10 years, CPR certified", "ok"],
  ["REALTOR", "Helping families buy homes in the Indian neighborhoods of Fremont", "block"],
  ["REALTOR", "Find a home in an area with lots of Indians and temples nearby", "block"],
  ["REALTOR", "Serving the Indian community for 12 years. Top schools, short commutes to Apple and Google.", "ok"],
  ["REALTOR", "Guaranteed sale in 30 days or I sell it for free", "block"],
  ["REALTOR", "First-time buyer specialist. 1% commission rebate to buyers.", "flag"],
  ["ROOM_RENTAL", "Room in a quiet desi area near the temple", "block"],
  ["LEGAL", "Immigration lawyer. Guaranteed green card approval!", "block"],
  ["LEGAL", "Notario services for H-1B and green card paperwork", "block"],
  ["LEGAL", "H-1B, green card and citizenship cases. 15 years of experience. Free 30-minute consultation.", "ok"],
  ["LEGAL", "Certified specialist in family law", "flag"],
  // Banned items, including disguised spellings.
  ["GOODS", "Selling w33d edibles, DM me", "block"],
  ["BEAUTY", "Relaxing e s c o r t service, discreet", "block"],
  ["GOODS", "Pure g@nja from home, fast delivery", "block"],
  ["GOODS", "Gutka and zarda packets available", "block"],
  ["GOODS", "Homemade daru for parties", "block"],
  ["SERVICES", "Daily satta matka tips, 100% sure numbers", "block"],
  ["SERVICES", "Hawala transfer to India, best rates", "block"],
  ["SERVICES", "Netflix accounts lifetime for $10", "block"],
  ["SERVICES", "Experience certificates for sale, any company", "block"],
  ["SERVICES", "Fake degree from US university, no exams", "block"],
  ["GOODS", "Ivory bangles from grandmother's collection", "block"],
  ["GOODS", "Ozempic pens, no prescription needed", "block"],
  ["SERVICES", "Erotic photos and videos", "block"],
  ["GOODS", "Buy Google reviews and followers for your shop", "block"],
  ["GOODS", "Golden retriever puppies for sale", "flag"],
  // Ordinary listings that share words with banned ones.
  ["BEAUTY", "Bridal makeup with nude lipstick shades and HD foundation", "ok"],
  ["FOOD", "Methi paratha and poppy seed (khus khus) halwa, $8", "ok"],
  ["ROOM_RENTAL", "Room with washer hookup, 1BHK, $1200 per month", "ok"],
  ["EVENT_SERVICES", "Full service catering for weddings, 50 to 500 guests", "ok"],
  ["FOOD", "Farm fresh eggs for sale, $6 a dozen", "ok"],
  ["FOOD", "Lean chicken curry meal plan, 5 days $60", "ok"],
  ["GOODS", "Strip mall shop closing sale: sarees and kurtas 50% off", "ok"],
  ["CLOTHING", "Kanjivaram silk sarees with pure zari, $250", "ok"],
];
let bad = 0;
for (const [cat, text, want] of cases) {
  const r = screenListing(text, cat);
  const got = r.block ? "block" : r.flags.length ? "flag" : "ok";
  const ok = want.endsWith("?") ? true : got === want;
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", `[${cat}] ${text} -> ${got}`, r.block ?? r.flags.join("; "));
}
console.log(bad ? `${bad} failed` : "all passed");
if (bad) process.exit(1);
