// Call and WhatsApp buttons for a seller's US phone number.
export function ContactButtons({ phone, whatsapp, name, compact = false }: { phone: string; whatsapp: boolean; name: string; compact?: boolean }) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? `1${digits}` : digits;
  const text = encodeURIComponent(`Hi ${name}, I saw your listing on BharathMela.`);
  return (
    <div className={compact ? "grid grid-flow-col gap-2" : "flex flex-wrap gap-2"}>
      <a href={`tel:+${intl}`} className="btn">
        {compact ? "📞 Call" : `Call ${phone}`}
      </a>
      <a href={`sms:+${intl}`} className="btn-outline">
        Text
      </a>
      {whatsapp && (
        <a href={`https://wa.me/${intl}?text=${text}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
          WhatsApp
        </a>
      )}
    </div>
  );
}
