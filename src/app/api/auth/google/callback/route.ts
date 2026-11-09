import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STATE_COOKIE, VERIFIER_COOKIE, finishProviderLogin } from "@/lib/oauth-finish";
import { googleClient } from "@/lib/oauth";

// Google sends the person back here with a code. The ID token comes straight from Google's token endpoint
// over TLS, so its claims can be trusted without checking its signature.
export async function GET(req: Request) {
  const google = googleClient();
  const url = new URL(req.url);
  const jar = await cookies();
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  if (!google || !code || !state || !verifier || state !== jar.get(STATE_COOKIE)?.value) redirect("/login?error=oauth");
  let claims: { email?: string; email_verified?: boolean; name?: string };
  try {
    const tokens = await google.validateAuthorizationCode(code, verifier);
    claims = decodeIdToken(tokens.idToken()) as typeof claims;
  } catch (e) {
    console.error("[auth] Google sign-in failed", e);
    redirect("/login?error=oauth");
  }
  await finishProviderLogin(claims.email, claims.email_verified === true, claims.name ?? "");
}
