// Run with `npm test`. Messages that usually mean a scam get a warning in the conversation; ordinary ones don't.
import { RISKY_PAYMENT } from "../src/lib/scam-words";

const risky = [
  "Please pay with Amazon gift cards",
  "Can you wire the money today?",
  "Send it by Western Union",
  "I only accept crypto",
  "Pay a deposit first and I'll hold the room",
  "Tell me the verification code you got",
];
const fine = [
  "Can you do an oil change this Saturday?",
  "I'll pay by Zelle after the class",
  "Is the deposit refundable when I move out?",
  "Yes, it's available.",
];
let failed = 0;
for (const m of risky) if (!RISKY_PAYMENT.test(m)) (failed++, console.log("FAIL should warn:", m));
for (const m of fine) if (RISKY_PAYMENT.test(m)) (failed++, console.log("FAIL should not warn:", m));
console.log(failed ? `${failed} failed` : "all passed");
if (failed) process.exit(1);
