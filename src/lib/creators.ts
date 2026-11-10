// Creators and influencers who promote local businesses: their platforms and audience, niches, content
// languages, reach (local, or nationwide online), rates, and whether they take barter (free food, products or
// services instead of cash). Stored as JSON in Listing.details. Nationwide creators are also marked with a
// NATIONWIDE tag so every city's Creators page can include them, and barter with a BARTER tag.
import { LANGUAGES } from "./professionals";

const opts = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const NICHES = opts(
  ["FOOD", "Food & restaurants"],
  ["BEAUTY_FASHION", "Beauty & fashion"],
  ["DANCE_MUSIC", "Dance & music"],
  ["COMEDY", "Comedy & skits"],
  ["FAMILY_KIDS", "Family & kids"],
  ["LIFESTYLE", "Lifestyle & vlogs"],
  ["WEDDINGS", "Weddings & events"],
  ["DEVOTIONAL", "Devotional & culture"],
  ["TECH_CAREERS", "Tech & careers"],
  ["REAL_ESTATE_FINANCE", "Real estate & finance"],
  ["FITNESS", "Fitness & yoga"],
  ["TRAVEL", "Travel"],
);

export const PLATFORMS = [
  { id: "INSTAGRAM", label: "Instagram", url: (h: string) => `https://www.instagram.com/${h}` },
  { id: "YOUTUBE", label: "YouTube", url: (h: string) => `https://www.youtube.com/@${h}` },
  { id: "TIKTOK", label: "TikTok", url: (h: string) => `https://www.tiktok.com/@${h}` },
  { id: "FACEBOOK", label: "Facebook", url: (h: string) => `https://www.facebook.com/${h}` },
  { id: "X", label: "X (Twitter)", url: (h: string) => `https://x.com/${h}` },
] as const;

export const RATE_KINDS = opts(
  ["STORY", "Story"],
  ["REEL", "Reel / Short"],
  ["POST", "Feed post"],
  ["VIDEO", "YouTube video"],
  ["APPEARANCE", "Event appearance"],
);

export const FOLLOWER_STEPS = [1_000, 5_000, 10_000, 50_000, 100_000];

// Where sample posts may link to: the platforms themselves, nothing else.
const SAMPLE_HOSTS = /^(www\.|m\.)?(instagram\.com|youtube\.com|youtu\.be|tiktok\.com|facebook\.com|fb\.watch|x\.com|twitter\.com)$/i;

export type CreatorPlatform = {
  platform: string;
  handle: string;
  followers: number;
  // Set when an admin confirmed the creator owns this handle (bio code), with the follower count then.
  verifiedAt?: string;
  verifiedFollowers?: number;
};

// A verified badge lasts while the handle stays the same and the reported audience hasn't jumped more
// than this past what was checked (real growth is fine; re-check to raise it further).
export const VERIFIED_GROWTH = 1.25;

export const isVerified = (p: CreatorPlatform) => !!p.verifiedAt && p.followers <= Math.max((p.verifiedFollowers ?? 0) * VERIFIED_GROWTH, (p.verifiedFollowers ?? 0) + 500);
export const anyVerified = (d: CreatorDetails) => d.platforms.some(isVerified);

// Keep verification through an edit for handles that didn't change.
export function carryVerification(next: CreatorDetails, prev: CreatorDetails | null): CreatorDetails {
  if (!prev) return next;
  return {
    ...next,
    platforms: next.platforms.map((p) => {
      const old = prev.platforms.find((o) => o.platform === p.platform && o.handle.toLowerCase() === p.handle.toLowerCase());
      return old?.verifiedAt ? { ...p, verifiedAt: old.verifiedAt, verifiedFollowers: old.verifiedFollowers } : p;
    }),
  };
}

// The code a creator puts in their bio: "BM-" and 4 characters that are easy to read and type.
export function newCheckCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `BM-${[...bytes].map((b) => chars[b % chars.length]).join("")}`;
}

export type CreatorDetails = {
  platforms: CreatorPlatform[];
  niches: string[];
  languages: string[];
  nationwide: boolean;
  barter: boolean;
  rates: Record<string, number>; // whole dollars, by RATE_KINDS id
  samples: string[];
};

export const EMPTY_CREATOR: CreatorDetails = {
  platforms: [],
  niches: [],
  languages: ["English"],
  nationwide: false,
  barter: true,
  rates: {},
  samples: [],
};

export function readCreator(json: string): CreatorDetails | null {
  try {
    const d = JSON.parse(json);
    return d && Array.isArray(d.platforms) && d.platforms.length ? { ...EMPTY_CREATOR, ...d } : null;
  } catch {
    return null;
  }
}

// "@desi.foodie", "instagram.com/desi.foodie/" or "https://www.youtube.com/@DesiFoodie" -> the bare handle.
export function cleanHandle(raw: string) {
  return raw
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^(www\.)?[a-z]+\.(com|be)\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .replace(/^@/, "")
    .slice(0, 60);
}

// "12k", "1.2M", "12,500" -> 12500.
export function parseFollowers(raw: string) {
  const m = raw.trim().toLowerCase().replace(/,/g, "").match(/^(\d+(?:\.\d+)?)\s*([km]?)$/);
  if (!m) return NaN;
  return Math.round(Number(m[1]) * (m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1));
}

export const formatFollowers = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${+(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n);

export const totalFollowers = (d: CreatorDetails) => d.platforms.reduce((sum, p) => sum + p.followers, 0);

export function parseCreatorForm(form: FormData): CreatorDetails | { error: string } {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const platforms: CreatorPlatform[] = [];
  for (const p of PLATFORMS) {
    const handle = cleanHandle(get(`c_handle_${p.id}`));
    if (!handle) continue;
    if (!/^[A-Za-z0-9._-]{2,60}$/.test(handle)) return { error: `Check your ${p.label} handle: letters, numbers, dots, dashes and underscores only.` };
    const followers = parseFollowers(get(`c_followers_${p.id}`));
    if (!Number.isFinite(followers) || followers < 0 || followers > 500_000_000) {
      return { error: `Enter your ${p.label} follower count, e.g. 12500 or 12.5K.` };
    }
    platforms.push({ platform: p.id, handle, followers });
  }
  if (!platforms.length) return { error: "Add at least one platform with your handle and follower count." };
  const niches = form.getAll("c_niches").map(String).filter((id) => NICHES.some((n) => n.id === id));
  if (!niches.length) return { error: "Choose what you create content about." };
  const languages = form.getAll("c_languages").map(String).filter((l) => (LANGUAGES as readonly string[]).includes(l));
  if (!languages.length) return { error: "Choose the languages your content is in." };
  const rates: Record<string, number> = {};
  for (const r of RATE_KINDS) {
    const raw = get(`c_rate_${r.id}`).replace(/[$,]/g, "");
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return { error: `Check your ${r.label.toLowerCase()} rate.` };
    rates[r.id] = Math.round(n);
  }
  const samples: string[] = [];
  for (const raw of form.getAll("c_samples").map(String).join("\n").split(/\s+/).filter(Boolean).slice(0, 6)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      return { error: `"${raw.slice(0, 60)}" isn't a link we can use.` };
    }
    if (!SAMPLE_HOSTS.test(url.hostname)) return { error: "Sample posts must be links to Instagram, YouTube, TikTok, Facebook or X." };
    url.protocol = "https:";
    samples.push(url.toString().slice(0, 300));
  }
  if (form.get("c_rules") !== "on") {
    return { error: "Please confirm you're 18 or older, your follower counts are real, and you'll mark paid or gifted posts as ads." };
  }
  return { platforms, niches, languages, nationwide: form.get("c_nationwide") === "on", barter: form.get("c_barter") === "on", rates, samples };
}

// Mark one handle verified (or not) on the stored details, keeping everything else.
export function withVerification(d: CreatorDetails, platform: string, verified: { at: Date; followers: number } | null): CreatorDetails {
  return {
    ...d,
    platforms: d.platforms.map((p) =>
      p.platform !== platform ? p : verified ? { ...p, followers: verified.followers, verifiedAt: verified.at.toISOString(), verifiedFollowers: verified.followers } : { ...p, verifiedAt: undefined, verifiedFollowers: undefined },
    ),
  };
}

// Tags kept on the listing for filtering in the database query.
export function creatorTags(d: CreatorDetails) {
  const tags = [d.nationwide && "NATIONWIDE", d.barter && "BARTER", anyVerified(d) && "VERIFIED"].filter(Boolean);
  return tags.length ? `,${tags.join(",")},` : "";
}

const label = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? "";
export const nicheLabels = (d: CreatorDetails) => d.niches.map((id) => label(NICHES, id)).filter(Boolean);
export const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? id;
export const profileUrl = (p: CreatorPlatform) => PLATFORMS.find((x) => x.id === p.platform)?.url(p.handle) ?? "";

// "Instagram 12K · YouTube 3.4K" for cards.
export const audienceSummary = (d: CreatorDetails) =>
  [...d.platforms].sort((a, b) => b.followers - a.followers).slice(0, 2).map((p) => `${platformLabel(p.platform)} ${formatFollowers(p.followers)}`).join(" · ");

export function creatorSearchText(d: CreatorDetails) {
  return [
    "influencer creator blogger vlogger content promotion collab",
    ...nicheLabels(d),
    ...d.languages,
    ...d.platforms.map((p) => `${platformLabel(p.platform)} ${p.handle}`),
    d.barter ? "barter" : "",
    d.nationwide ? "nationwide online" : "",
  ].join(" ");
}

export type CreatorFilters = { niche?: string; platform?: string; language?: string; minFollowers?: number; barter?: boolean; nationwide?: boolean; verified?: boolean };

export function matchesCreatorFilters(d: CreatorDetails | null, f: CreatorFilters) {
  if (!f.niche && !f.platform && !f.language && !f.minFollowers && !f.barter && !f.nationwide && !f.verified) return true;
  if (!d) return false;
  if (f.niche && !d.niches.includes(f.niche)) return false;
  if (f.platform && !d.platforms.some((p) => p.platform === f.platform)) return false;
  if (f.language && !d.languages.includes(f.language)) return false;
  if (f.minFollowers && totalFollowers(d) < f.minFollowers) return false;
  if (f.barter && !d.barter) return false;
  if (f.nationwide && !d.nationwide) return false;
  if (f.verified && !anyVerified(d)) return false;
  return true;
}

// ---------- Collab requests: a business asking creators for a promotion (a service request in CREATORS) ----------

export const COLLAB_PAY = opts(
  ["CASH", "Paid"],
  ["BARTER", "Barter only"],
  ["EITHER", "Paid or barter"],
);

export type CollabDetails = {
  pay: "CASH" | "BARTER" | "EITHER";
  barterOffer: string; // what the business offers instead of cash, e.g. "Dinner for 4 and a gift card"
  anywhere: boolean; // nationwide creators welcome, not only local ones
  language: string; // content language wanted, or ""
  platform: string; // platform wanted, or ""
};

export function readCollab(json: string): CollabDetails | null {
  try {
    const d = JSON.parse(json);
    return d && typeof d.pay === "string" ? { barterOffer: "", anywhere: true, language: "", platform: "", ...d } : null;
  } catch {
    return null;
  }
}

export function parseCollabForm(form: FormData): CollabDetails | { error: string } {
  const pay = String(form.get("k_pay") ?? "");
  if (!COLLAB_PAY.some((p) => p.id === pay)) return { error: "Choose how you'll pay the creator: paid, barter, or either." };
  const barterOffer = String(form.get("k_barter") ?? "").trim().replace(/\s+/g, " ").slice(0, 150);
  if (pay !== "CASH" && barterOffer.length < 5) return { error: "Say what you offer instead of cash, e.g. “Dinner for 4” or “A free month of classes”." };
  const language = String(form.get("k_language") ?? "");
  const platform = String(form.get("k_platform") ?? "");
  return {
    pay: pay as CollabDetails["pay"],
    barterOffer: pay === "CASH" ? "" : barterOffer,
    anywhere: form.get("k_anywhere") === "on",
    language: (LANGUAGES as readonly string[]).includes(language) ? language : "",
    platform: PLATFORMS.some((p) => p.id === platform) ? platform : "",
  };
}

// Whether a creator suits a collab request: niche, language and platform if asked for, and barter-only
// requests go only to creators open to barter. Location is checked separately.
export function creatorFitsCollab(c: CreatorDetails, k: CollabDetails, niche: string) {
  if (niche && !c.niches.includes(niche)) return false;
  if (k.language && !c.languages.includes(k.language)) return false;
  if (k.platform && !c.platforms.some((p) => p.platform === k.platform)) return false;
  if (k.pay === "BARTER" && !c.barter) return false;
  return true;
}

export const collabPayLabel = (k: CollabDetails) =>
  k.pay === "CASH" ? "Paid" : k.pay === "BARTER" ? `Barter: ${k.barterOffer}` : `Paid or barter (${k.barterOffer})`;
