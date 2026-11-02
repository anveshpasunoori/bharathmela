// Call and WhatsApp buttons for a seller's US phone number.
export function ContactButtons({ phone, whatsapp, name }: { phone: string; whatsapp: boolean; name: string }) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? `1${digits}` : digits;
  const text = encodeURIComponent(`Hi ${name}, I saw your listing on DesiBazaar.`);
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`tel:+${intl}`} className="btn">
        Call {phone}
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
