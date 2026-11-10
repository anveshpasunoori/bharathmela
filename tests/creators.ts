// Run with `npm test`. Creator profiles: handles and follower counts are read the way people type them,
// only social links are accepted as samples, and the filters and nationwide tag work.
import {
  type CreatorDetails, anyVerified, carryVerification, cleanHandle, creatorTags, formatFollowers, isVerified, matchesCreatorFilters, newCheckCode,
  parseCreatorForm, parseFollowers, withVerification,
} from "../src/lib/creators";

let failed = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) failed++;
  console.log(ok ? "PASS" : "FAIL", msg);
};

check(cleanHandle("@desi.foodie") === "desi.foodie", "handle with @");
check(cleanHandle("https://www.instagram.com/desi.foodie/?hl=en") === "desi.foodie", "handle from an Instagram link");
check(cleanHandle("youtube.com/@DesiFoodie") === "DesiFoodie", "handle from a YouTube link");
check(parseFollowers("12.5K") === 12500 && parseFollowers("1.2m") === 1200000 && parseFollowers("12,500") === 12500, "follower counts");
check(Number.isNaN(parseFollowers("lots")), "nonsense follower count is rejected");
check(formatFollowers(12500) === "13K" && formatFollowers(1500) === "1.5K" && formatFollowers(1200000) === "1.2M", "follower display");

const form = (fields: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return f;
};
const base = { c_handle_INSTAGRAM: "@jax.desi.eats", c_followers_INSTAGRAM: "8.4K", c_niches: ["FOOD"], c_languages: ["Telugu", "English"], c_rules: "on" };

const ok = parseCreatorForm(form({ ...base, c_barter: "on", c_nationwide: "on", c_rate_REEL: "$150", c_samples: "instagram.com/reel/abc123\nhttps://youtu.be/xyz" }));
check(!("error" in ok), "valid creator form is accepted");
if (!("error" in ok)) {
  check(ok.platforms[0].followers === 8400 && ok.platforms[0].handle === "jax.desi.eats", "platform saved");
  check(ok.rates.REEL === 150 && ok.barter && ok.nationwide, "rate, barter and nationwide saved");
  check(ok.samples.length === 2 && ok.samples.every((s) => s.startsWith("https://")), "samples saved as https links");
  check(creatorTags(ok) === ",NATIONWIDE,BARTER,", "nationwide and barter tags");
  check(matchesCreatorFilters(ok, { niche: "FOOD", language: "Telugu", minFollowers: 5000, barter: true }), "matches its own filters");
  check(!matchesCreatorFilters(ok, { minFollowers: 10000 }), "follower minimum filters it out");
  check(!matchesCreatorFilters(ok, { platform: "YOUTUBE" }), "platform filter");
}
const err = (fields: Record<string, string | string[]>) => {
  const r = parseCreatorForm(form(fields));
  return "error" in r ? r.error : "";
};
check(!!err({ ...base, c_handle_INSTAGRAM: "" }), "needs at least one platform");
check(!!err({ ...base, c_followers_INSTAGRAM: "" }), "needs a follower count");
check(!!err({ ...base, c_niches: [] }), "needs a niche");
check(!!err({ ...base, c_rules: "" }), "needs the rules confirmed");
check(!!err({ ...base, c_samples: "https://my-shady-site.xyz/promo" }), "sample links must be social platforms");
check(!!err({ ...base, c_handle_INSTAGRAM: "bad handle!" }), "bad handle is rejected");
// Handle verification.
check(/^BM-[A-HJ-NP-Z2-9]{4}$/.test(newCheckCode()), "check codes look like BM-7Q2X");
const parsed = parseCreatorForm(form({ ...base, c_handle_YOUTUBE: "@JaxEats", c_followers_YOUTUBE: "2K" })) as CreatorDetails;
const verified = withVerification(parsed, "INSTAGRAM", { at: new Date(), followers: 8000 });
check(isVerified(verified.platforms[0]) && verified.platforms[0].followers === 8000, "admin's follower count replaces the creator's");
check(!isVerified(verified.platforms[1]) && anyVerified(verified), "only the checked handle is verified");
check(creatorTags(verified).includes("VERIFIED") && matchesCreatorFilters(verified, { verified: true }), "verified tag and filter");
check(!matchesCreatorFilters(parsed, { verified: true }), "unverified creator is filtered out");
const sameHandle = carryVerification(parseCreatorForm(form({ ...base, c_handle_INSTAGRAM: "@JAX.DESI.EATS", c_followers_INSTAGRAM: "9K" })) as CreatorDetails, verified);
check(isVerified(sameHandle.platforms[0]), "an edit keeps the badge when the handle is the same");
const grown = carryVerification(parseCreatorForm(form({ ...base, c_followers_INSTAGRAM: "15K" })) as CreatorDetails, verified);
check(!isVerified(grown.platforms[0]), "the badge lapses when followers jump more than 25%");
const renamed = carryVerification(parseCreatorForm(form({ ...base, c_handle_INSTAGRAM: "@someone.else" })) as CreatorDetails, verified);
check(!isVerified(renamed.platforms[0]), "a new handle needs a new check");
const forged = parseCreatorForm(form({ ...base, verifiedAt: "2026-01-01" })) as CreatorDetails;
check(!anyVerified(forged), "the form can't mark itself verified");
console.log(failed ? `${failed} failed` : "all passed");
