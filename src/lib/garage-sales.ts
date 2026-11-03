// Garage and moving sales: when and where the sale is, kept in the listing's details. A sale listing
// comes down the day after its last day instead of after the usual LISTING_DAYS.
export type GarageSaleDetails = { startDate: string; endDate: string; hours: string; address: string };

const DAY_MS = 86_400_000;
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function parseGarageSaleForm(form: FormData, today = new Date().toISOString().slice(0, 10)): GarageSaleDetails | { error: string } {
  const startDate = String(form.get("saleStart") ?? "");
  const endDate = String(form.get("saleEnd") ?? "") || startDate;
  const hours = String(form.get("saleHours") ?? "").trim().slice(0, 40);
  const address = String(form.get("saleAddress") ?? "").trim().slice(0, 120);
  if (!isDate(startDate) || !isDate(endDate)) return { error: "Pick the sale's first and last day." };
  if (endDate < startDate) return { error: "The last day can't be before the first day." };
  if (endDate < today) return { error: "That sale has already ended. Pick upcoming dates." };
  if ((Date.parse(endDate) - Date.parse(startDate)) / DAY_MS > 13) return { error: "A sale can run up to two weeks." };
  if (Date.parse(startDate) - Date.parse(today) > 60 * DAY_MS) return { error: "Post your sale within two months of its first day." };
  if (!hours) return { error: "Add the hours, like “8 AM – 1 PM”." };
  return { startDate, endDate, hours, address };
}

export function readGarageSale(details: string): GarageSaleDetails | null {
  try {
    const d = JSON.parse(details);
    return isDate(d.startDate) && isDate(d.endDate) ? { startDate: d.startDate, endDate: d.endDate, hours: String(d.hours ?? ""), address: String(d.address ?? "") } : null;
  } catch {
    return null;
  }
}

// The listing stays up through the sale's last day (US time zones end up to ~10 hours after UTC midnight).
export const saleExpiry = (d: GarageSaleDetails) => new Date(Date.parse(d.endDate) + DAY_MS + 10 * 3_600_000);

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

// "Sat, Nov 14 · 8 AM – 1 PM" or "Sat, Nov 14 – Sun, Nov 15 · 8 AM – 1 PM".
export const saleWhen = (d: GarageSaleDetails) =>
  `${day(d.startDate)}${d.endDate !== d.startDate ? ` – ${day(d.endDate)}` : ""}${d.hours ? ` · ${d.hours}` : ""}`;
