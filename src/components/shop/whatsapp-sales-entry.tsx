import { getStoreContact } from "@/lib/store-contact";

function toWhatsAppDigits(raw: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  let s = raw.trim().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (s.startsWith("0") && !s.startsWith("00")) s = `98${s.slice(1)}`;
  if (s.startsWith("+")) s = s.slice(1);
  return s;
}

/** دکمه مشاوره واتساپ — از تنظیمات ادمین */
export async function WhatsAppSalesEntry({
  compact = false,
}: {
  compact?: boolean;
}) {
  const c = await getStoreContact();
  const wa = c.whatsapp || "";
  if (!wa) return null;
  const digits = toWhatsAppDigits(wa);
  if (!digits) return null;
  const label = c.chatLabel || "مشاوره واتساپ";
  const href = `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "text-primary text-sm underline"
          : "bg-emerald-600 hover:bg-emerald-700 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white"
      }
    >
      {label}
    </a>
  );
}
