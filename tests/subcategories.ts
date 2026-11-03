// Run with `npm test`. Every category has subcategories with unique URL words, food's don't clash with
// its dietary markers, and the browse links and sitemap agree on which subcategory a listing is under.
import { CATEGORIES, DIET_TAGS } from "../src/lib/constants";
import { citySubcategoryPath, listingSubcategories, subcategoriesFor, subcategoryFromSlug } from "../src/lib/subcategories";

let failed = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) failed++;
  console.log(ok ? "PASS" : "FAIL", msg);
};

for (const c of CATEGORIES) {
  const subs = subcategoriesFor(c.id);
  check(!!subs && subs.options.length >= 3, `${c.id} has subcategories`);
  if (!subs) continue;
  const slugs = subs.options.map((o) => o.slug);
  check(new Set(slugs).size === slugs.length && slugs.every((x) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x)), `${c.id} subcategory URLs are unique and clean`);
  check(subs.options.every((o) => subcategoryFromSlug(c.id, o.slug)?.id === o.id), `${c.id} subcategory URLs round-trip`);
}
const food = subcategoriesFor("FOOD")!.options.map((o) => o.id);
check(!food.some((id) => DIET_TAGS.some((t) => t.id === id)), "food subcategories don't reuse dietary marker ids");
check(citySubcategoryPath("jacksonville", "AUTO", "OIL_CHANGE") === "/in/jacksonville/auto-services/oil-change", "clean subcategory path");
for (const want of ["TOWING", "COLLISION", "CAR_SALES", "DETAILING", "BODY_SHOP"]) {
  check(subcategoriesFor("AUTO")!.options.some((o) => o.id === want), `Auto has ${want}`);
}
check(
  JSON.stringify(listingSubcategories({ category: "FOOD", tags: ",VEGETARIAN,TIFFIN,THALI,", details: "{}" })) === '["TIFFIN","THALI"]',
  "food listing's subcategories ignore dietary markers",
);
check(
  JSON.stringify(listingSubcategories({ category: "ROOM_RENTAL", tags: "", details: JSON.stringify({ spaceType: "PRIVATE_ROOM" }) })) === '["PRIVATE_ROOM"]',
  "room rental subcategory comes from its space type",
);
console.log(failed ? `${failed} failed` : "all passed");
if (failed) process.exit(1);
