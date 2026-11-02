import { db } from "@/lib/db";

export default async function AdminActivityPage() {
  const entries = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const admins = await db.user.findMany({
    where: { id: { in: [...new Set(entries.map((e) => e.actorId))] } },
    select: { id: true, email: true },
  });
  const email = new Map(admins.map((a) => [a.id, a.email]));

  return (
    <section className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Activity log</h1>
        <p className="text-sm text-stone-600">Every admin decision, newest first. Entries can&apos;t be edited.</p>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-stone-100">
                <td className="whitespace-nowrap px-4 py-2 text-stone-500">{e.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2">{email.get(e.actorId) ?? e.actorId}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-2 font-mono text-xs text-stone-500">{e.targetType}/{e.targetId.slice(-8)}</td>
                <td className="px-4 py-2 text-stone-600">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-4 text-stone-600">No admin actions yet.</p>}
      </div>
    </section>
  );
}
