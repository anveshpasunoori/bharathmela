// Run with `npm run test:db` (needs DATABASE_URL pointing at a migrated Postgres). Checks the shared
// rate-limit counter: parallel requests can't slip past the limit, and a new window starts fresh.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
let fail = 0;
const check = (name: string, ok: boolean, got: unknown) => {
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", name, "->", JSON.stringify(got));
};

// The same statement as hit() in src/lib/rate-limit.ts (that module is server-only).
async function hit(id: string, limit: number, windowMs: number) {
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${id}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return rows[0].count <= limit;
}

(async () => {
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  const results = await Promise.all(Array.from({ length: 12 }, () => hit("test:parallel", 10, 60_000)));
  check("12 parallel attempts, limit 10", results.filter(Boolean).length === 10, results.filter(Boolean).length);
  await db.rateLimit.update({ where: { key: "test:parallel" }, data: { resetAt: new Date(Date.now() - 1000) } });
  const fresh = await hit("test:parallel", 10, 60_000);
  check("allowed again once the window ends", fresh, fresh);
  const other = await hit("test:other", 1, 60_000);
  check("separate keys count separately", other, other);
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  await db.$disconnect();
  console.log(fail ? `${fail} failed` : "all passed");
  if (fail) process.exit(1);
})();
