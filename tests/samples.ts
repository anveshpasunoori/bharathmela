// Every sample listing in the dev seed should pass moderation cleanly, and every category should have samples.
import { SAMPLE_VENDORS } from "../prisma/samples";
import { CATEGORIES } from "../src/lib/constants";
import { isMetro } from "../src/lib/metros";
import { screenListing } from "../src/lib/moderation";

let failed = 0;
const fail = (msg: string) => {
  failed++;
  console.log(`FAIL ${msg}`);
};

for (const v of SAMPLE_VENDORS) {
  if (!isMetro(v.metro)) fail(`${v.email}: unknown metro ${v.metro}`);
  for (const l of v.listings) {
    const r = screenListing(`${l.title}\n${l.description}`, l.category);
    if (r.block || r.flags.length) fail(`${l.title}: ${r.block ?? r.flags.join(", ")}`);
  }
}
for (const metro of ["bay-area", "jacksonville"]) {
  for (const c of CATEGORIES) {
    const n = SAMPLE_VENDORS.filter((v) => v.metro === metro).flatMap((v) => v.listings).filter((l) => l.category === c.id).length;
    if (!n) fail(`no ${c.id} sample in ${metro}`);
  }
}
const total = SAMPLE_VENDORS.reduce((n, v) => n + v.listings.length, 0);
console.log(failed ? `${failed} failed` : `all passed (${total} sample listings)`);
if (failed) process.exit(1);
