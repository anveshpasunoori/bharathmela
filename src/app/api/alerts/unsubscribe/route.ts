import { unsubscribeSearch } from "@/app/actions/saved-search";

// One-click unsubscribe (RFC 8058) from the List-Unsubscribe header on alert emails: mail apps POST here.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token) await unsubscribeSearch(token);
  return new Response(null, { status: 204 });
}
