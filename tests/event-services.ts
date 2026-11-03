// Run with `npm test`. Checks the safety confirmations required for bartending, photography and bounce houses.
import { parseEventServiceForm } from "../src/lib/event-services";
import { LANGUAGES } from "../src/lib/professionals";

const form = (fields: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of fields) f.append(k, v);
  return f;
};
const base: [string, string][] = [["e_occasions", "WEDDING"], ["e_languages", "English"]];
const cases: [string, [string, string][], boolean][] = [
  ["DJ only", [...base, ["e_services", "DJ"]], true],
  ["bartending without confirmation", [...base, ["e_services", "BARTENDING"]], false],
  ["bartending with confirmation", [...base, ["e_services", "BARTENDING"], ["e_alcoholConfirm", "on"]], true],
  ["photography without portfolio confirmation", [...base, ["e_services", "PHOTOGRAPHY"]], false],
  ["party rentals with no items", [...base, ["e_services", "RENTALS"]], false],
  ["bounce house without safety confirmation", [...base, ["e_services", "RENTALS"], ["e_rentalItems", "BOUNCE"]], false],
  ["bounce house with safety confirmation", [...base, ["e_services", "RENTALS"], ["e_rentalItems", "BOUNCE"], ["e_inflatableConfirm", "on"]], true],
  ["no occasions", [["e_services", "DJ"]], false],
];
let bad = 0;
for (const [name, fields, shouldPass] of cases) {
  const r = parseEventServiceForm(form(fields), LANGUAGES);
  const passed = !("error" in r);
  const ok = passed === shouldPass;
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", name, "->", passed ? "accepted" : `rejected: ${"error" in r ? r.error : ""}`);
}
console.log(bad ? `${bad} failed` : "all passed");
if (bad) process.exit(1);
