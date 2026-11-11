// Run with `npm test`. Checks what a saved search keeps from the results URL and how it's named.
import { describeSearch, parseFilters, searchQueryString } from "../src/lib/browse-params";

let fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", name, "->", JSON.stringify(got));
};

// Keeps search params in a stable order and drops location, sort, paging and redirect markers.
check(
  "query string keeps only the search",
  searchQueryString({ radius: "25", sort: "price_asc", from: "FOOD", ss: "x", maxRent: "1000", category: "ROOM_RENTAL", pets: "1" }),
  "category=ROOM_RENTAL&maxRent=1000&pets=1",
);
check("same search, different order, same string", searchQueryString({ pets: "1", category: "ROOM_RENTAL", maxRent: "1000" }), "category=ROOM_RENTAL&maxRent=1000&pets=1");
check("nothing to save", searchQueryString({ radius: "10", metro: "dallas" }), "");

const name = (p: Record<string, string>, where: string) => describeSearch(parseFilters(p), where);
check(
  "room search name",
  name({ category: "ROOM_RENTAL", space: "PRIVATE_ROOM", maxRent: "1000", pbath: "1" }, "within 25 mi of Saint Johns"),
  "Room Rentals · Private room · up to $1,000 · private bath · within 25 mi of Saint Johns",
);
check("food with diet", name({ category: "FOOD", diet: "VEGAN,GLUTEN_FREE", q: "dosa" }, "in Jacksonville, FL"), "Home Food & Fresh Produce · “dosa” · Vegan, Gluten-free · in Jacksonville, FL");
check("lawyer filters", name({ category: "LEGAL", spec: "IMMIGRATION", lang: "Telugu", free: "1" }, "in Dallas–Fort Worth, TX"), "Lawyers & Legal Services · Immigration (H-1B, green card, citizenship) · speaks Telugu · free consultation · in Dallas–Fort Worth, TX");
check("filters for another category are ignored", name({ category: "FOOD", maxRent: "900", svc: "DJ" }, "in Atlanta, GA"), "Home Food & Fresh Produce · in Atlanta, GA");
check("keyword only", name({ q: "pujari" }, "in Jacksonville, FL"), "“pujari” · in Jacksonville, FL");

console.log(fail ? `${fail} failed` : "all passed");
if (fail) process.exit(1);
