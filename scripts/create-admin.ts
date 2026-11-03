// Creates (or resets the password of) an admin account in any environment, without sample data.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' npm run create-admin
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 14) {
  console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 14 characters.");
  process.exit(1);
}

const db = new PrismaClient();
(async () => {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: "Admin", role: "ADMIN", passwordHash, emailVerifiedAt: new Date() },
  });
  console.log(`Admin ready: ${user.email}`);
  await db.$disconnect();
})();
