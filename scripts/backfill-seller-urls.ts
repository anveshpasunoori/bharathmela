import { db } from "../src/lib/db";
import { ensureSellerPath } from "../src/lib/seller-urls";

async function main() {
  let count = 0;
  while (true) {
    const sellers = await db.vendorProfile.findMany({
      where: { publicPath: null }, select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 100,
    });
    if (!sellers.length) break;
    for (const seller of sellers) {
      await ensureSellerPath(seller.id);
      count++;
    }
  }
  console.log(`Assigned readable URLs to ${count} businesses.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
