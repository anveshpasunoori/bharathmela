import { activityLabel } from "@/lib/time";

// What we actually know about a seller: whether we checked the business, verified contact details, how
// recently they were on the site and how fast they usually reply.
export function TrustBadges({
  emailVerified,
  phoneVerified,
  lastSeenAt,
  businessVerified = false,
  replyLabel = null,
}: {
  emailVerified: boolean;
  phoneVerified: boolean;
  lastSeenAt: Date | null;
  businessVerified?: boolean;
  replyLabel?: string | null;
}) {
  const active = activityLabel(lastSeenAt);
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="Seller checks">
      {businessVerified && (
        <li className="badge bg-orange-100 font-semibold text-orange-800 ring-1 ring-orange-200" title="BharathMela checked this business is real">
          ✓ Verified business
        </li>
      )}
      {active && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">● {active}</li>}
      {phoneVerified && <li className="badge bg-sky-50 text-sky-800 ring-1 ring-sky-200">✓ Phone verified</li>}
      {emailVerified && <li className="badge bg-sky-50 text-sky-800 ring-1 ring-sky-200">✓ Email verified</li>}
      {replyLabel && <li className="badge bg-stone-100 text-stone-700 ring-1 ring-stone-200">⏱ {replyLabel}</li>}
    </ul>
  );
}
