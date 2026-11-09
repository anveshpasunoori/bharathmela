"use client";

// A Call / Text / WhatsApp link that also tells the server about the tap (for the seller's lead counts),
// without holding up the call: sendBeacon goes out in the background as the link opens.
export function TrackedContactLink({
  href,
  kind,
  vendorId,
  listingId,
  className,
  external = false,
  children,
}: {
  href: string;
  kind: "CALL" | "TEXT" | "WHATSAPP";
  vendorId?: string;
  listingId?: string;
  className: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => {
        if (!vendorId) return;
        const body = new Blob([JSON.stringify({ vendorId, listingId, kind })], { type: "application/json" });
        try {
          navigator.sendBeacon("/api/lead", body);
        } catch {
          // Counting is best-effort.
        }
      }}
    >
      {children}
    </a>
  );
}
