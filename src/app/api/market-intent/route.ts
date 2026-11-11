import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { intentDay } from "@/lib/market-intent-data";
import { INTENT_KINDS, isIntentAction, type IntentKind } from "@/lib/market-intents";
import { isMetro } from "@/lib/metros";
import { clientIp, hit } from "@/lib/rate-limit";
import { parseQuery } from "@/lib/search";
import { resolveLocation } from "@/lib/user-location";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return new Response(null, { status: 204 });
  }
  // Browser sends a short JSON array. Limit actual bytes before parsing.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const decoder = new TextDecoder();
  let payload = "";
  let bytes = 0;
  let data: unknown;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      payload += decoder.decode(value, { stream: true });
    }
    data = JSON.parse(payload + decoder.decode());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!Array.isArray(data)) return new Response(null, { status: 400 });
  const [kind, selectedAction, selectedMetro, query] = data;
  if (!INTENT_KINDS.includes(kind as IntentKind)) return new Response(null, { status: 400 });
  const action = isIntentAction(selectedAction) ? selectedAction
    : kind === "search" && typeof query === "string" ? parseQuery(query.slice(0, 100)).hintedCategory : undefined;
  if (!isIntentAction(action)) return new Response(null, { status: 204 });

  try {
    const { metro } = await resolveLocation(isMetro(selectedMetro) ? selectedMetro : undefined);
    const day = intentDay(new Date());
    const ip = await clientIp(request.headers);
    if (!(await hit("marketIntent", ip))) return new Response(null, { status: 429 });
    const agent = request.headers.get("user-agent")?.slice(0, 300) ?? "";
    const visitorKey = createHmac("sha256", secret).update(`market-intent|${day.toISOString()}|${ip}|${agent}`).digest("hex").slice(0, 32);
    await db.marketIntent.createMany({ data: [{ day, metro, action, kind, visitorKey }], skipDuplicates: true });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[market-intent] Could not record interaction", (error as { code?: string }).code);
    return new Response(null, { status: 503 });
  }
}
