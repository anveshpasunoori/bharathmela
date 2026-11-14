// Applies pending database migrations (run by `npm run db:deploy`, before every Vercel build).
//
// Prisma takes a Postgres advisory lock while migrating. Through Neon's pooled connection (a "-pooler"
// host, which the app itself should keep using) that lock can be left held on a pooled session, so the
// next deploy times out waiting for it (P1002) and every other build fails. Migrations therefore use the
// direct connection: DIRECT_URL when set, otherwise DATABASE_URL with "-pooler" taken out of the host name.
import { spawnSync } from "node:child_process";

// Without DATABASE_URL in the environment (local runs), Prisma reads .env itself; leave it alone.
const env = { ...process.env };
const pooled = process.env.DATABASE_URL;
const direct = process.env.DIRECT_URL || pooled?.replace(/-pooler(?=\.)/, "");
if (direct && direct !== pooled) {
  env.DATABASE_URL = direct;
  console.log("Migrating over the direct (unpooled) database connection.");
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env });
process.exit(result.status ?? 1);
