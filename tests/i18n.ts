// Run with `npm test`. Every phrase and category name has a translation in every language, and placeholders
// like {city} are kept in each translation.
import { CATEGORIES } from "../src/lib/constants";
import { LANGS, __strings, categoryName } from "../src/lib/i18n";

let failed = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) {
    failed++;
    console.log("FAIL", msg);
  }
};

for (const [key, entry] of Object.entries(__strings) as [string, Record<string, string>][]) {
  const holes = (entry.en.match(/\{\w+\}/g) ?? []).sort().join(" ");
  for (const l of LANGS) {
    check(!!entry[l.id]?.trim(), `${key} has ${l.name}`);
    check((entry[l.id]?.match(/\{\w+\}/g) ?? []).sort().join(" ") === holes, `${key} (${l.id}) keeps placeholders ${holes}`);
  }
}
for (const c of CATEGORIES) {
  for (const l of LANGS.filter((x) => x.id !== "en")) check(categoryName(l.id, c.id, c.label) !== c.label, `${c.id} has a ${l.name} name`);
}
console.log(failed ? `${failed} failed` : "all passed");
if (failed) process.exit(1);
