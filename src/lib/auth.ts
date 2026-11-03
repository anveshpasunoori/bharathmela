import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "session";
const SESSION_DAYS = 30;

// The cookie holds a random token; the database only stores its hash.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { include: { vendor: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  // Suspended or deleted accounts are treated as logged out everywhere.
  if (session.user.suspendedAt || session.user.deletedAt) return null;
  // Record activity for "Active recently" badges, at most every 10 minutes to keep writes low.
  const seen = session.user.lastSeenAt?.getTime() ?? 0;
  if (Date.now() - seen > 10 * 60_000) {
    await db.user.update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } });
  }
  return session.user;
});

export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireVendor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vendor");
  if (!user.vendor) redirect(user.role === "ADMIN" ? "/admin" : "/");
  if (!user.emailVerifiedAt) redirect("/verify?next=/vendor");
  return { user, vendor: user.vendor };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
