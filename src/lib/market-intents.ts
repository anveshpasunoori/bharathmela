import { DEFAULT_SEARCH_RADIUS } from "./browse-params";
import { CATEGORIES, categoryLabel } from "./constants";
import { CATEGORY_SLUGS } from "./seo";

export const INTENT_WINDOW_DAYS = 14;
export const INTENT_RETENTION_DAYS = 30;
export const MIN_INTENT_SIGNALS = 5;
export const INTENT_KINDS = ["browse", "search", "start"] as const;
export type IntentKind = (typeof INTENT_KINDS)[number];

const actions = {
  EVENTS: { label: "Community events", href: "/events" },
  REQUEST: { label: "Post a request", href: "/requests/new" },
  SELL: { label: "List your business", href: "/vendor/signup" },
  ROOMS_WANTED: { label: "Find people looking for a room", href: "/rooms-wanted" },
} as const;

export function isIntentAction(value: unknown): value is string {
  return typeof value === "string" && (Object.hasOwn(actions, value) || CATEGORIES.some(({ id }) => id === value));
}

export function intentDestination(action: string, metro?: string) {
  if (Object.hasOwn(actions, action)) {
    const item = actions[action as keyof typeof actions];
    return { label: item.label, href: action === "EVENTS" && metro ? `${item.href}?metro=${metro}` : item.href };
  }
  return { label: categoryLabel(action), href: `/?category=${action}&radius=${DEFAULT_SEARCH_RADIUS}` };
}

export function intentForLink(url: URL): { action: string; kind: IntentKind; metro?: string } | undefined {
  const parts = url.pathname.split("/").filter(Boolean);
  const [root, city, slug] = parts;
  const metro = url.searchParams.get("metro") ?? (root === "in" ? city : undefined);
  if (root === "events") return { action: "EVENTS", kind: "start", metro };
  if (url.pathname === "/requests/new" || url.pathname === "/rooms-wanted/new") return { action: "REQUEST", kind: "start", metro };
  if (url.pathname === "/vendor/signup" || url.pathname === "/vendor/listings/new") return { action: "SELL", kind: "start", metro };
  if (root === "rooms-wanted") return { action: "ROOMS_WANTED", kind: "start", metro };
  const category = root === "creators" ? "CREATORS"
    : root === "in" ? Object.entries(CATEGORY_SLUGS).find(([, value]) => value === slug)?.[0]
    : url.pathname === "/" ? url.searchParams.get("category") : undefined;
  if (isIntentAction(category)) return { action: category, kind: "browse", metro };
}

type Signal = { action: string; kind: string; recent: boolean; count: number };
const weights: Record<IntentKind, number> = { browse: 1, search: 3, start: 2 };

export function rankMarketIntents(signals: Signal[]) {
  const actions = new Map<string, { action: string; score: number; signals: number }>();
  for (const { action, kind, recent, count } of signals) {
    if (!isIntentAction(action) || !Object.hasOwn(weights, kind) || count <= 0) continue;
    const row = actions.get(action) ?? { action, score: 0, signals: 0 };
    row.signals += count;
    row.score += count * weights[kind as IntentKind] * (recent ? 2 : 1);
    actions.set(action, row);
  }
  return [...actions.values()].sort((a, b) => b.score - a.score || b.signals - a.signals || a.action.localeCompare(b.action));
}

export function selectPopularIntents(local: Signal[], site: Signal[]) {
  const eligible = (rows: Signal[]) => rankMarketIntents(rows).filter((row) => row.signals >= MIN_INTENT_SIGNALS).slice(0, 3);
  const nearby = eligible(local);
  return nearby.length ? { scope: "local" as const, rows: nearby } : { scope: "site" as const, rows: eligible(site) };
}
