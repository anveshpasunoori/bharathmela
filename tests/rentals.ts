// Run with `npm test`. Checks that a roommate gender preference is only kept for shared living the poster lives in.
import { parseRentalForm } from "../src/lib/rentals";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};
const base = { r_availableFrom: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10), r_roommateGender: "FEMALE" };
const cases: [string, Record<string, string>, string][] = [
  ["shared room, lives there", { ...base, r_spaceType: "PRIVATE_ROOM", r_ownerOccupied: "on" }, "FEMALE"],
  ["shared room, doesn't live there", { ...base, r_spaceType: "PRIVATE_ROOM" }, "ANY"],
  ["entire apartment, claims lives there", { ...base, r_spaceType: "ENTIRE_APARTMENT", r_ownerOccupied: "on" }, "ANY"],
  ["paying guest, lives there", { ...base, r_spaceType: "PAYING_GUEST", r_ownerOccupied: "on" }, "FEMALE"],
];
let bad = 0;
for (const [name, fields, want] of cases) {
  const r = parseRentalForm(form(fields));
  const got = "error" in r ? `error: ${r.error}` : r.roommateGender;
  const ok = got === want;
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", name, "->", got);
}
const both = parseRentalForm(form({ ...base, r_spaceType: "PRIVATE_ROOM", r_houseRules: "NO_PETS" }));
const both2 = new FormData();
for (const [k, v] of Object.entries({ ...base, r_spaceType: "PRIVATE_ROOM" })) both2.append(k, v);
both2.append("r_houseRules", "NO_PETS");
both2.append("r_houseRules", "PETS_OK");
const conflict = parseRentalForm(both2);
const okConflict = "error" in conflict && !("error" in both);
if (!okConflict) bad++;
console.log(okConflict ? "PASS" : "FAIL", "no pets + pets allowed is rejected");
console.log(bad ? `${bad} failed` : "all passed");
if (bad) process.exit(1);
