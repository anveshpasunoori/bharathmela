import { activityLabel } from "@/lib/time";

// What we actually know about a seller: verified contact details and how recently they were on the site.
export function TrustBadges({
  emailVerified,
  phoneVerified,
  lastSeenAt,
}: {
  emailVerified: boolean;
  phoneVerified: boolean;
  lastSeenAt: Date | null;
}) {
  const active = activityLabel(lastSeenAt);
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="Seller checks">
      {active && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">● {active}</li>}
      {phoneVerified && <li className="badge bg-sky-50 text-sky-800 ring-1 ring-sky-200">✓ Phone verified</li>}
      {emailVerified && <li className="badge bg-sky-50 text-sky-800 ring-1 ring-sky-200">✓ Email verified</li>}
    </ul>
  );
}
