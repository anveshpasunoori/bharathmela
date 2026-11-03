// Run with `npm test`. Checks near-duplicate detection for reposted and copied listings.
import { findDuplicates, similarity } from "../src/lib/duplicates";

const original = {
  id: "a", vendorId: "v1", title: "Weekly Andhra meal box (5 days)",
  description: "Home-style rice, dal, curry, pickle and curd. Pickup in Santa Clara or delivery within 5 miles.",
};
const cases: [string, string, string, "own" | "copied" | "none"][] = [
  ["same seller reposts with tiny change", "v1", "Weekly Andhra meal box (5 days!) Home-style rice, dal, curry, pickle and curd. Pickup in Santa Clara or delivery within 5 miles.", "own"],
  ["another account copies the ad", "v2", "Weekly Andhra meal box 5 days. Home style rice, dal, curry, pickle and curd. Pickup in Santa Clara or delivery within 5 miles.", "copied"],
  ["same seller, genuinely different item", "v1", "Party orders – biryani trays. Chicken or veg dum biryani. Order 3 days ahead.", "none"],
  ["different seller, same dish, own words", "v2", "Telugu tiffin service: rice, sambar, two curries and yogurt delivered daily in Sunnyvale.", "none"],
];
let bad = 0;
for (const [name, vendorId, text, want] of cases) {
  const { own, copied } = findDuplicates(text, vendorId, [original]);
  const got = own ? "own" : copied ? "copied" : "none";
  const ok = got === want;
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", name, "->", got, `(similarity ${similarity(text, `${original.title} ${original.description}`).toFixed(2)})`);
}
console.log(bad ? `${bad} failed` : "all passed");
if (bad) process.exit(1);
