import { db } from "@/lib/db";
import { configProblems } from "@/lib/env";

// For uptime monitors: 200 when the database answers and required settings are present, 503 otherwise.
export async function GET() {
  const { missing } = configProblems();
  let databaseReady = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    databaseReady = false;
  }
  const ok = databaseReady && missing.length === 0;
  return Response.json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
