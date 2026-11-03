import { db } from "@/lib/db";
import { configProblems } from "@/lib/env";

// For uptime monitors: 200 when the database answers and required settings are present, 503 otherwise.
export async function GET() {
  const { missing } = configProblems();
  let database = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }
  const ok = database === "ok" && !missing.length;
  return Response.json({ ok, database, missingSettings: missing }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
