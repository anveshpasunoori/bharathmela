import assert from "node:assert/strict";
import { boostAvailability, TRIAL_BOOST_DAYS } from "../src/lib/boost-policy";
import { MIN_INTENT_SIGNALS } from "../src/lib/market-intents";

const now = new Date("2026-11-11T12:00:00Z");
const listing = { status: "ACTIVE", featuredUntil: null, expiresAt: new Date("2026-12-30T12:00:00Z") };
assert.equal(boostAvailability(listing, TRIAL_BOOST_DAYS, MIN_INTENT_SIGNALS, now).reason, null);
assert.match(boostAvailability(listing, 7, MIN_INTENT_SIGNALS - 1, now).reason!, /enough recent search activity/);
assert.match(boostAvailability(listing, 7, null, now).reason!, /temporarily unavailable/);
assert.match(boostAvailability({ ...listing, status: "HIDDEN" }, 7, 20, now).reason!, /Publish or renew/);
assert.match(boostAvailability({ ...listing, expiresAt: new Date("2026-11-17T12:00:00Z") }, 7, 20, now).reason!, /throughout the promotion/);
const next = boostAvailability({ ...listing, featuredUntil: new Date("2026-11-18T12:00:00Z") }, 7, 20, now);
assert.equal(next.startsAt.toISOString(), "2026-11-18T12:00:00.000Z");
assert.equal(next.endsAt.toISOString(), "2026-11-25T12:00:00.000Z");
console.log("Boost eligibility and scheduling passed");
