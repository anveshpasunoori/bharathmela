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
