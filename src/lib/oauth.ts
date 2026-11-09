import "server-only";
// "Continue with Google / Apple". Each provider turns on when its settings are present (see DEPLOY.md).
// The provider tells us the person's verified email; that email finds their account, or a new buyer
// account is made for it. Sessions are the app's own (src/lib/auth.ts).
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { Apple, Google } from "arctic";
import { db } from "./db";
import { readAttribution } from "./growth";
import { TERMS_VERSION } from "./legal";
import { siteUrl } from "./seo";

export type Provider = "google" | "apple";

const callback = (p: Provider) => `${siteUrl()}/api/auth/${p}/callback`;

export function googleClient() {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
  return id && secret ? new Google(id, secret, callback("google")) : null;
}

export function appleClient() {
  const { APPLE_CLIENT_ID: id, APPLE_TEAM_ID: team, APPLE_KEY_ID: key, APPLE_PRIVATE_KEY: pem } = process.env;
  if (!id || !team || !key || !pem) return null;
  // The .p8 key from Apple, pasted with its BEGIN/END lines (newlines may be written as \n).
  const body = pem.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return new Apple(id, team, key, Uint8Array.from(Buffer.from(body, "base64")), callback("apple"));
}

export const enabledProviders = (): Provider[] => [...(googleClient() ? (["google"] as const) : []), ...(appleClient() ? (["apple"] as const) : [])];

// Find the account for a verified email, or make a buyer account for it. Returns null for suspended or
// deleted accounts.
export async function userForProviderLogin(email: string, name: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.suspendedAt || existing.deletedAt) return null;
    // Signing in with the provider proves they own the address.
    if (!existing.emailVerifiedAt) await db.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
    return existing;
  }
  const from = await readAttribution();
  return db.user.create({
    data: {
      email,
      name: name.slice(0, 100) || email.split("@")[0],
      role: "BUYER",
      // No password yet; "Forgot password" lets them set one later.
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
      emailVerifiedAt: new Date(),
      // The buttons say "By continuing you agree to the Terms of Service".
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date(),
      signupSource: from.source,
      signupCampaign: from.campaign,
    },
  });
}

// Where to go afterwards: a same-site path only.
export const safeNextPath = (next: string | undefined) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
