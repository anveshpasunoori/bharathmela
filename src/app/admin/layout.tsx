import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [listings, reports, payments] = await Promise.all([
    db.listing.count({ where: { status: "PENDING_REVIEW" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.payment.count({ where: { status: "PENDING" } }),
  ]);
  return (
    <div className="space-y-6">
      <AdminNav counts={{ queue: reports + payments, listings }} />
      {children}
    </div>
  );
}
