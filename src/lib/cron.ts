import "server-only";

// Scheduled endpoints accept "Authorization: Bearer <CRON_SECRET>" (Vercel Cron sends it). In development
// they also run without a secret.
export function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return secret ? req.headers.get("authorization") === `Bearer ${secret}` : process.env.NODE_ENV !== "production";
}
