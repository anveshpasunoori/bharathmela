import { setBusinessVerified, setSuspended } from "../../actions/admin";
import { db } from "@/lib/db";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? { OR: [{ email: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }, { vendor: { businessName: { contains: query, mode: "insensitive" } } }] }
        : {}),
    },
    include: { vendor: { select: { id: true, businessName: true, businessVerifiedAt: true, _count: { select: { listings: true } } } }, _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-stone-600">Suspending signs the person out, blocks login, and hides their listings and ratings.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} className="input" placeholder="Search name, email or business" aria-label="Search users" />
          <button className="btn-outline">Search</button>
        </form>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Activity</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-stone-100 align-top">
                <td className="px-4 py-2">
                  <p className="font-medium">{u.vendor?.businessName ?? u.name}</p>
                  <p className="text-stone-500">{u.email}</p>
                </td>
                <td className="px-4 py-2">{u.role.toLowerCase()}</td>
                <td className="px-4 py-2 text-stone-600">
                  {u.vendor ? `${u.vendor._count.listings} listings` : `${u._count.reviews} ratings`}
                  <br />
                  joined {u.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {u.suspendedAt ? (
                    <span className="badge bg-red-100 text-red-800" title={u.suspendReason}>Suspended</span>
                  ) : u.emailVerifiedAt ? (
                    <span className="badge bg-green-100 text-green-800">Verified</span>
                  ) : (
                    <span className="badge bg-stone-200 text-stone-700">Unverified</span>
                  )}
                </td>
                <td className="space-y-2 px-4 py-2">
                  {u.vendor && (
                    <form action={setBusinessVerified.bind(null, u.vendor.id, !u.vendor.businessVerifiedAt)}>
                      <button className="btn-outline py-1.5">{u.vendor.businessVerifiedAt ? "Remove verified badge" : "Mark business verified"}</button>
                    </form>
                  )}
                  {u.role !== "ADMIN" &&
                    (u.suspendedAt ? (
                      <form action={setSuspended.bind(null, u.id, false)}>
                        <button className="btn-outline py-1.5">Unsuspend</button>
                      </form>
                    ) : (
                      <form action={setSuspended.bind(null, u.id, true)} className="flex gap-2">
                        <input name="note" className="input py-1.5" placeholder="Reason" required aria-label="Suspension reason" />
                        <button className="btn-outline py-1.5 text-red-700">Suspend</button>
                      </form>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-stone-600">No users found.</p>}
      </div>
    </section>
  );
}
