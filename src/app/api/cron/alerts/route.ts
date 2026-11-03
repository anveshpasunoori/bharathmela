import { cronAuthorized } from "@/lib/cron";
import { runSearchAlerts } from "@/lib/saved-searches";

// Sends saved-search alerts on their own (the daily job at /api/cron/daily also does this).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runSearchAlerts());
}
