// Page intros and city questions are written from what's listed, so each page reads differently.
import assert from "node:assert/strict";
import { cityFaq, joinList, pageFaq, pageIntro } from "../src/lib/page-faq";

const listing = (title: string, seller: string, priceCents: number | null, priceUnit = "per box") => ({ title, priceCents, priceUnit, vendor: { businessName: seller } });

assert.equal(joinList([]), "");
assert.equal(joinList(["Orange Park"]), "Orange Park");
assert.equal(joinList(["A", "B", "C"]), "A, B and C");

const food = [listing("Veg tiffin", "Lakshmi", 1200), listing("Biryani tray", "Lakshmi", 6000), listing("Snacks", "Ravi", 800)];
const intro = pageIntro({ lead: "Home-cooked tiffins", city: "Jacksonville", listings: food, towns: ["Orange Park", "Ponte Vedra Beach"] });
assert.match(intro, /^Home-cooked tiffins in Jacksonville\. 3 listings from 2 local sellers in Orange Park and Ponte Vedra Beach, with prices from \$8 per box\./);
assert.match(pageIntro({ lead: "Creators", city: "Dallas", listings: [], towns: [], noun: "creator" }), /local creators will send you quotes/);
assert.match(pageIntro({ lead: "X", city: "Dallas", listings: [listing("One", "Solo", null)], towns: [] }), /1 listing from 1 local seller\. /);

// Areas and request questions only when they apply.
const qs = (f: { q: string }[]) => f.map((x) => x.q);
assert.ok(qs(pageFaq({ what: "Home Food", city: "Jacksonville", listings: food, towns: ["A", "B"] })).includes("Which areas around Jacksonville are covered?"));
assert.ok(!qs(pageFaq({ what: "Home Food", city: "Jacksonville", listings: food, towns: ["A"] })).some((q) => q.startsWith("Which areas")));
assert.ok(!qs(pageFaq({ what: "Rooms", city: "Jacksonville", listings: food, requests: false })).some((q) => q.startsWith("Can I get quotes")));

const city = cityFaq({ city: "Jacksonville", counts: [{ label: "Home Food", n: 5 }, { label: "Auto Services", n: 9 }, { label: "Tutoring", n: 0 }], events: [{ title: "Diwali Mela" }] });
assert.equal(city[0].a, "14 listings from the Indian community, most in auto services and home food.");
assert.equal(city[1].q, "Are there Indian events in Jacksonville coming up?");
assert.equal(cityFaq({ city: "Austin", counts: [], events: [] }).length, 3);

console.log("page-faq: all checks passed");
