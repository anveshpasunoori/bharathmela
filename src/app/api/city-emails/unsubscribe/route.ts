import { unsubscribeCityEmails } from "@/app/actions/city-emails";

// One-click unsubscribe (RFC 8058) from the List-Unsubscribe header on the monthly city email.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token) await unsubscribeCityEmails(token);
  return new Response(null, { status: 204 });
}
