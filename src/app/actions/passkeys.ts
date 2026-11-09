"use server";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { revalidatePath } from "next/cache";
import { createSession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { safeNextPath } from "@/lib/oauth";
import { RP_NAME, deviceName, expectedOrigins, rpID, saveChallenge, takeChallenge } from "@/lib/passkeys";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";
import { sendVerificationCode } from "@/lib/verification";

const MAX_PASSKEYS = 10;
const splitTransports = (t: string) => (t ? t.split(",") : undefined);

// Step 1 of adding a passkey (Account page): what the browser needs to make one.
export async function passkeyRegistrationOptions() {
  const user = await requireUser("/account");
  const existing = await db.passkey.findMany({ where: { userId: user.id }, select: { credentialId: true, transports: true } });
  if (existing.length >= MAX_PASSKEYS) return { error: `You can have up to ${MAX_PASSKEYS} passkeys. Remove one first.` };
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpID(),
    userName: user.email,
    userDisplayName: user.name,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    // Don't make a second passkey on a device that already has one for this account.
    excludeCredentials: existing.map((p) => ({ id: p.credentialId, transports: splitTransports(p.transports) })),
    // A discoverable passkey, so signing in doesn't need the email typed first.
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await saveChallenge(options.challenge);
  return { options };
}

// Step 2: check what the browser made and keep its public key.
export async function savePasskey(response: RegistrationResponseJSON) {
  const user = await requireUser("/account");
  const challenge = await takeChallenge();
  if (!challenge) return { error: "That took too long. Please try again." };
  try {
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: expectedOrigins(),
      expectedRPID: rpID(),
      requireUserVerification: false,
    });
    if (!verified) return { error: "That passkey couldn't be checked. Please try again." };
    const { credential } = registrationInfo;
    if (await db.passkey.findUnique({ where: { credentialId: credential.id } })) return { error: "That passkey is already added." };
    await db.passkey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: (credential.transports ?? []).join(","),
        name: await deviceName(),
      },
    });
  } catch {
    return { error: "That passkey couldn't be checked. Please try again." };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function removePasskey(id: string) {
  const user = await requireUser("/account");
  await db.passkey.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account");
}

// Step 1 of signing in: a challenge for any passkey this site made (the browser shows the person's own).
export async function passkeyLoginOptions() {
  if (!(await hit("login", await clientIp()))) return { error: TOO_MANY };
  const options = await generateAuthenticationOptions({ rpID: rpID(), userVerification: "preferred" });
  await saveChallenge(options.challenge);
  return { options };
}

// Step 2: check the signature against the stored public key, then sign them in. Returns where to go next.
export async function passkeyLogin(response: AuthenticationResponseJSON, next: string) {
  const challenge = await takeChallenge();
  if (!challenge) return { error: "That took too long. Please try again." };
  const passkey = await db.passkey.findUnique({ where: { credentialId: response.id }, include: { user: true } });
  if (!passkey) {
    return { error: "That passkey isn't linked to a BharathMela account any more. Log in with your email and password, then add it again on your Account page." };
  }
  try {
    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: expectedOrigins(),
      expectedRPID: rpID(),
      credential: { id: passkey.credentialId, publicKey: new Uint8Array(passkey.publicKey), counter: passkey.counter, transports: splitTransports(passkey.transports) },
      requireUserVerification: false,
    });
    if (!verified) return { error: "That passkey didn't work. Please try again." };
    await db.passkey.update({ where: { id: passkey.id }, data: { counter: authenticationInfo.newCounter, lastUsedAt: new Date() } });
  } catch {
    return { error: "That passkey didn't work. Please try again." };
  }

  const user = passkey.user;
  if (user.deletedAt) return { error: "That account has been deleted." };
  if (user.suspendedAt) return { error: "This account has been suspended. Contact support if you think this is a mistake." };
  await createSession(user.id);
  if (user.role === "ADMIN") return { redirect: "/admin" };
  const to = safeNextPath(next) === "/" && user.role === "VENDOR" ? "/vendor" : safeNextPath(next);
  if (user.emailVerifiedAt) return { redirect: to };
  const sent = await sendVerificationCode(user);
  return { redirect: `/verify?next=${encodeURIComponent(to)}${sent.error && !sent.waiting ? "&unsent=1" : ""}` };
}
