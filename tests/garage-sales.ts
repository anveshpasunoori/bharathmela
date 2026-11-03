// Run with `npm test`. Checks garage-sale dates: what's accepted, when the listing comes down, and how it reads.
import { parseGarageSaleForm, saleExpiry, saleWhen } from "../src/lib/garage-sales";

let fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", name, "->", JSON.stringify(got));
};
const form = (f: Record<string, string>) => {
  const d = new FormData();
  for (const [k, v] of Object.entries(f)) d.set(k, v);
  return d;
};
const today = "2026-11-03";
const parse = (f: Record<string, string>) => parseGarageSaleForm(form(f), today);

check("one-day sale", parse({ saleStart: "2026-11-07", saleHours: "8 AM – 1 PM" }), { startDate: "2026-11-07", endDate: "2026-11-07", hours: "8 AM – 1 PM", address: "" });
check("weekend sale with address", parse({ saleStart: "2026-11-07", saleEnd: "2026-11-08", saleHours: "9–2", saleAddress: "Nocatee" }), { startDate: "2026-11-07", endDate: "2026-11-08", hours: "9–2", address: "Nocatee" });
check("ends before it starts", parse({ saleStart: "2026-11-08", saleEnd: "2026-11-07", saleHours: "9–2" }), { error: "The last day can't be before the first day." });
check("already over", parse({ saleStart: "2026-10-31", saleHours: "9–2" }), { error: "That sale has already ended. Pick upcoming dates." });
check("too far ahead", parse({ saleStart: "2027-02-01", saleHours: "9–2" }), { error: "Post your sale within two months of its first day." });
check("needs hours", parse({ saleStart: "2026-11-07" }), { error: "Add the hours, like “8 AM – 1 PM”." });

const sale = { startDate: "2026-11-07", endDate: "2026-11-08", hours: "8 AM – 1 PM", address: "" };
check("comes down the morning after the last day (US time)", saleExpiry(sale).toISOString(), "2026-11-09T10:00:00.000Z");
check("reads as a weekend", saleWhen(sale), "Sat, Nov 7 – Sun, Nov 8 · 8 AM – 1 PM");
check("one day reads as one date", saleWhen({ ...sale, endDate: "2026-11-07" }), "Sat, Nov 7 · 8 AM – 1 PM");

console.log(fail ? `${fail} failed` : "all passed");
if (fail) process.exit(1);
