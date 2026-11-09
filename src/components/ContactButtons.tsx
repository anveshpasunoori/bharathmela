import { TrackedContactLink } from "./TrackedContactLink";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

// Call and WhatsApp buttons for a seller's US phone number, in the visitor's language.
// `vendorId` (and `listingId`) count the tap as a lead for the seller.
export async function ContactButtons({
  phone,
  whatsapp,
  name,
  compact = false,
  vendorId,
  listingId,
}: {
  phone: string;
  whatsapp: boolean;
  name: string;
  compact?: boolean;
  vendorId?: string;
  listingId?: string;
}) {
  const lang = await getLang();
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? `1${digits}` : digits;
  const text = encodeURIComponent(`Hi ${name}, I saw your listing on BharathMela.`);
  return (
    <div className={compact ? "grid grid-flow-col gap-2" : "flex flex-wrap gap-2"}>
      <TrackedContactLink href={`tel:+${intl}`} kind="CALL" vendorId={vendorId} listingId={listingId} className="btn">
        {compact ? `📞 ${t(lang, "call")}` : `${t(lang, "call")} ${phone}`}
      </TrackedContactLink>
      <TrackedContactLink href={`sms:+${intl}`} kind="TEXT" vendorId={vendorId} listingId={listingId} className="btn-outline">
        {t(lang, "text")}
      </TrackedContactLink>
      {whatsapp && (
        <TrackedContactLink href={`https://wa.me/${intl}?text=${text}`} kind="WHATSAPP" vendorId={vendorId} listingId={listingId} className="btn-outline" external>
          WhatsApp
        </TrackedContactLink>
      )}
    </div>
  );
}
