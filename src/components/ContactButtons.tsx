import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

// Call and WhatsApp buttons for a seller's US phone number, in the visitor's language.
export async function ContactButtons({ phone, whatsapp, name, compact = false }: { phone: string; whatsapp: boolean; name: string; compact?: boolean }) {
  const lang = await getLang();
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? `1${digits}` : digits;
  const text = encodeURIComponent(`Hi ${name}, I saw your listing on BharathMela.`);
  return (
    <div className={compact ? "grid grid-flow-col gap-2" : "flex flex-wrap gap-2"}>
      <a href={`tel:+${intl}`} className="btn">
        {compact ? `📞 ${t(lang, "call")}` : `${t(lang, "call")} ${phone}`}
      </a>
      <a href={`sms:+${intl}`} className="btn-outline">
        {t(lang, "text")}
      </a>
      {whatsapp && (
        <a href={`https://wa.me/${intl}?text=${text}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
          WhatsApp
        </a>
      )}
    </div>
  );
}
