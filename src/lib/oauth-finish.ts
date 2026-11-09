import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "./auth";
import { welcomeVerifiedSeller } from "./growth";
import { safeNextPath, userForProviderLogin } from "./oauth";

export const STATE_COOKIE = "bm_oauth_state";
export const VERIFIER_COOKIE = "bm_oauth_verifier";
export const NEXT_COOKIE = "bm_oauth_next";

// Shared end of both callbacks: sign the person in and send them on.
export async function finishProviderLogin(email: string | undefined, verified: boolean, name: string) {
  const jar = await cookies();
  const next = safeNextPath(jar.get(NEXT_COOKIE)?.value);
  for (const c of [STATE_COOKIE, VERIFIER_COOKIE, NEXT_COOKIE]) jar.delete(c);
  if (!email || !verified) redirect("/login?error=unverified");
  const user = await userForProviderLogin(email.toLowerCase(), name);
  if (!user) redirect("/login?error=suspended");
  await createSession(user.id);
  if (user.role === "ADMIN") redirect("/admin");
  await welcomeVerifiedSeller(user.id);
  redirect(next === "/" && user.role === "VENDOR" ? "/vendor" : next);
}
