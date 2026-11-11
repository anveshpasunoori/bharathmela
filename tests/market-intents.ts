import assert from "node:assert/strict";
import { intentDestination, intentForLink, rankMarketIntents, selectPopularIntents } from "../src/lib/market-intents";

const url = (path: string) => new URL(path, "https://www.bharathmela.com");
assert.deepEqual(intentForLink(url("/in/jacksonville/home-food/fresh-produce")), { action: "FOOD", kind: "browse", metro: "jacksonville" });
assert.deepEqual(intentForLink(url("/events?metro=orlando")), { action: "EVENTS", kind: "start", metro: "orlando" });
assert.equal(intentForLink(url("/vendor/listings/new"))?.action, "SELL");
assert.equal(intentForLink(url("/in/jacksonville")), undefined);
assert.equal(intentForLink(url("/?category=invalid")), undefined);
assert.equal(intentDestination("FOOD").href, "/?category=FOOD&radius=25");

const site = [
  { action: "FOOD", kind: "browse", count: 19, recent: false },
  { action: "TUTORING", kind: "search", count: 6, recent: true },
  { action: "EVENTS", kind: "start", count: 5, recent: true },
  { action: "SELL", kind: "start", count: 3, recent: true },
];
assert.equal(rankMarketIntents(site)[0]?.action, "TUTORING");
assert.deepEqual(selectPopularIntents([], site).rows.map(({ action }) => action), ["TUTORING", "EVENTS", "FOOD"]);
assert.equal(selectPopularIntents(site.slice(3), []).rows.length, 0);
assert.equal(selectPopularIntents(site.slice(2, 3), site).scope, "local");
assert.equal(selectPopularIntents(site.slice(2, 3), site).rows[0]?.action, "EVENTS");
assert.equal(rankMarketIntents([{ action: "FOOD", kind: "invalid", count: 100, recent: true }]).length, 0);
console.log("Marketplace intent checks passed");
