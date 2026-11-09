import "server-only";
// Passkeys: sign in with Face ID, Touch ID, Windows Hello or a phone instead of a password. Someone adds a
// passkey on their Account page while logged in; after that, "Sign in with a passkey" on the login page
// finds their account without typing an email. The one-time challenge waits in a short-lived cookie.
import { cookies, headers } from "next/headers";
import { siteUrl } from "./seo";

export const RP_NAME = "BharathMela";
const CHALLENGE_COOKIE = "bm_passkey_challenge";

// The site's domain without "www.", so a passkey made on www.bharathmela.com also works on bharathmela.com.
export function rpID() {
  return new URL(siteUrl()).hostname.replace(/^www\./, "");
}

export function expectedOrigins() {
  const url = new URL(siteUrl());
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return [url.origin];
  const apex = url.hostname.replace(/^www\./, "");
  return [`${url.protocol}//${apex}`, `${url.protocol}//www.${apex}`];
}

export async function saveChallenge(challenge: string) {
  (await cookies()).set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
  });
}

// The challenge works once: it's removed as it's read.
export async function takeChallenge() {
  const jar = await cookies();
  const challenge = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  return challenge;
}

// A friendly name for the device the passkey was made on, from the browser's user agent.
export async function deviceName() {
  const ua = (await headers()).get("user-agent") ?? "";
  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android phone"
        : /Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows PC"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux computer"
                : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return [device, browser].filter(Boolean).join(" · ") || "Passkey";
}
