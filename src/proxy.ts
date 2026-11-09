import { NextResponse, type NextRequest } from "next/server";

// Remembers where a visitor came from, so a later sign-up can be traced to the WhatsApp group, flyer or
// seller that brought them (see src/lib/growth.ts). The first tagged link wins for the source; the latest
// seller referral link wins for the referral. Cookie names match SOURCE_COOKIE and REFERRAL_COOKIE.
const SIXTY_DAYS = 60 * 24 * 60 * 60;
const clean = (v: string | null, max: number) => (v ?? "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, max);

export function proxy(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const source = clean(params.get("utm_source"), 60);
  const ref = clean(params.get("ref"), 40);
  if (!source && !ref) return NextResponse.next();
  const response = NextResponse.next();
  const options = { maxAge: SIXTY_DAYS, path: "/", sameSite: "lax" as const, httpOnly: true, secure: request.nextUrl.protocol === "https:" };
  if (source && !request.cookies.has("bm_src")) {
    response.cookies.set("bm_src", JSON.stringify({ s: source, c: clean(params.get("utm_campaign"), 80) }), options);
  }
  if (/^[a-z0-9]{10,40}$/.test(ref)) response.cookies.set("bm_ref", ref, options);
  return response;
}

export const config = {
  // Pages only: not Next's files, images, the API or files with an extension.
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
