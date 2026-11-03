// Run with `npm test`. Checks typical-rent comparisons and the too-cheap scam warning.
import { compareRent, median } from "../src/lib/rent-stats";

let bad = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", name, "->", JSON.stringify(detail));
};
const nearby = [120000, 130000, 125000, 140000, 115000, 135000];
check("median of even list", median([1, 3, 5, 7]) === 4, median([1, 3, 5, 7]));
check("not enough comparables", compareRent(120000, [120000, 130000]) === null, compareRent(120000, [120000, 130000]));
const fair = compareRent(125000, nearby);
check("fair rent", !!fair && fair.typicalCents === 127500 && !fair.suspiciouslyLow, fair);
const cheap = compareRent(50000, nearby);
check("$500 room where typical is $1,275 is flagged", !!cheap && cheap.suspiciouslyLow && cheap.percent === -61, cheap);
const pricey = compareRent(160000, nearby);
check("pricey room isn't flagged", !!pricey && !pricey.suspiciouslyLow && pricey.percent === 25, pricey);
console.log(bad ? `${bad} failed` : "all passed");
if (bad) process.exit(1);
