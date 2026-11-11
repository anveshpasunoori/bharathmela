import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { selectFestivalCover } from "../src/lib/festival-cover";
import { BUSINESS_COVERS, BUSINESS_COVER_INTERVAL_MS } from "../src/lib/home-cover";

const east = "America/New_York";
const cover = (day: string) => selectFestivalCover(new Date(`${day}T17:00:00Z`), east);

for (const [day, expected] of [
  ["2026-12-18", "Christmas"],
  ["2027-01-07", "Sankranthi / Pongal"],
  ["2027-03-10", "Eid al-Fitr"],
  ["2027-03-22", "Holi"],
  ["2027-04-15", "Vishu"],
  ["2027-05-17", "Eid al-Adha"],
  ["2027-09-12", "Onam"],
  ["2027-10-02", "Navratri / Garba"],
  ["2027-10-28", "Diwali"],
  ["2027-10-30", "Halloween"],
  ["2028-10-31", "Halloween"],
]) {
  const result = cover(day);
  assert.equal(result?.festival, expected, day);
  assert.ok(existsSync(`public${result!.src}`), `Missing ${expected} artwork`);
}

for (const day of ["2026-11-11", "2026-11-15", "2026-11-24", "2026-12-17", "2027-11-01", "2027-11-04"]) {
  assert.equal(cover(day), null, day);
}

assert.deepEqual(BUSINESS_COVERS.map((slide) => slide.label), ["Music lessons", "Bharatanatyam lessons", "Food businesses", "Room rentals", "Cleaning services", "Clothing & jewelry"]);
assert.ok(BUSINESS_COVERS.every(({ src }) => existsSync(`public${src}`)));
assert.equal(BUSINESS_COVER_INTERVAL_MS, 6_000);

const midnightEast = new Date("2026-12-18T05:00:00Z");
assert.equal(selectFestivalCover(midnightEast, east)?.festival, "Christmas");
assert.equal(selectFestivalCover(midnightEast, "America/Los_Angeles"), null);
console.log("Homepage cover schedule passed");
