import { runSearchAlerts } from "@/lib/saved-searches";

// Sends saved-search alert emails. Call on a schedule (vercel.json runs it daily) with
// "Authorization: Bearer <CRON_SECRET>". In development it also runs without a secret: `npm run alerts`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret ? req.headers.get("authorization") === `Bearer ${secret}` : process.env.NODE_ENV !== "production";
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runSearchAlerts());
}
