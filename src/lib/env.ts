// Settings production can't run without, and ones that quietly degrade the site when missing.
const REQUIRED = ["DATABASE_URL", "APP_URL", "CRON_SECRET", "RESEND_API_KEY", "EMAIL_FROM"] as const;
const RECOMMENDED: Record<string, string> = {
  S3_BUCKET: "photos are saved to local disk and lost on redeploy",
  S3_PUBLIC_URL: "photos can't be served from object storage",
  TWILIO_ACCOUNT_SID: "sellers can't verify their phone numbers",
  ANTHROPIC_API_KEY: "the AI ad writer is off",
};

export function configProblems() {
  if (process.env.NODE_ENV !== "production") return { missing: [] as string[], warnings: [] as string[] };
  const missing: string[] = REQUIRED.filter((k) => !process.env[k]);
  const warnings = Object.entries(RECOMMENDED).filter(([k]) => !process.env[k]).map(([k, why]) => `${k} not set: ${why}`);
  if (process.env.APP_URL && !process.env.APP_URL.startsWith("https://")) warnings.push("APP_URL should start with https://");
  if (process.env.S3_BUCKET && !process.env.S3_PUBLIC_URL) missing.push("S3_PUBLIC_URL");
  return { missing, warnings };
}
