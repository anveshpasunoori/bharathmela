import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NEXT_COOKIE, STATE_COOKIE, VERIFIER_COOKIE } from "@/lib/oauth-finish";
import { appleClient, googleClient, safeNextPath } from "@/lib/oauth";

// "Continue with Google / Apple": send the person to the provider, remembering a one-time state (and for
// Google a PKCE verifier) and where to go afterwards.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const next = safeNextPath(new URL(req.url).searchParams.get("next") ?? undefined);
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const state = generateState();
  const tenMinutes = 10 * 60;
  if (provider === "google") {
    const google = googleClient();
    if (!google) return new Response("Google sign-in isn't set up.", { status: 404 });
    const verifier = generateCodeVerifier();
    const opts = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: tenMinutes };
    jar.set(STATE_COOKIE, state, opts);
    jar.set(VERIFIER_COOKIE, verifier, opts);
    jar.set(NEXT_COOKIE, next, opts);
    const url = google.createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
    url.searchParams.set("prompt", "select_account");
    return Response.redirect(url.toString(), 302);
  }
  if (provider === "apple") {
    const apple = appleClient();
    if (!apple) return new Response("Apple sign-in isn't set up.", { status: 404 });
    // Apple returns with a cross-site POST, which only carries cookies marked SameSite=None (and Secure).
    const opts = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/", maxAge: tenMinutes };
    jar.set(STATE_COOKIE, state, opts);
    jar.set(NEXT_COOKIE, next, opts);
    const url = apple.createAuthorizationURL(state, ["name", "email"]);
    url.searchParams.set("response_mode", "form_post");
    return Response.redirect(url.toString(), 302);
  }
  return new Response("Not found", { status: 404 });
}
