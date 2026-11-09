import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STATE_COOKIE, finishProviderLogin } from "@/lib/oauth-finish";
import { appleClient } from "@/lib/oauth";

// Apple posts the person back here (response_mode=form_post). Their name comes only on the first sign-in,
// in the `user` field; the email is in the ID token from Apple's token endpoint.
export async function POST(req: Request) {
  const apple = appleClient();
  const form = await req.formData();
  const code = String(form.get("code") ?? "");
  const state = String(form.get("state") ?? "");
  if (!apple || !code || !state || state !== (await cookies()).get(STATE_COOKIE)?.value) redirect("/login?error=oauth");
  let claims: { email?: string; email_verified?: boolean | string };
  try {
    const tokens = await apple.validateAuthorizationCode(code);
    claims = decodeIdToken(tokens.idToken()) as typeof claims;
  } catch (e) {
    console.error("[auth] Apple sign-in failed", e);
    redirect("/login?error=oauth");
  }
  let name = "";
  try {
    const user = JSON.parse(String(form.get("user") ?? "{}")) as { name?: { firstName?: string; lastName?: string } };
    name = [user.name?.firstName, user.name?.lastName].filter(Boolean).join(" ");
  } catch {
    // No name on later sign-ins; the email's first part is used for new accounts.
  }
  await finishProviderLogin(claims.email, claims.email_verified === true || claims.email_verified === "true", name);
}
