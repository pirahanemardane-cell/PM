import { getStoreContact } from "@/lib/store-contact";
import { toPersianDigits } from "@/lib/numbers";

/** تماس پشتیبانی از تنظیمات ادمین */
export async function FooterContact() {
  const c = await getStoreContact();
  if (!c.phone && !c.email) return null;

  return (
    <div className="space-y-1 text-sm" dir="rtl">
      <p className="font-medium text-primary">پشتیبانی</p>
      {c.phone ? (
        <p>
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:underline" dir="ltr">
            {toPersianDigits(c.phone)}
          </a>
        </p>
      ) : null}
      {c.email ? (
        <p>
          <a href={`mailto:${c.email}`} className="hover:underline" dir="ltr">
            {c.email}
          </a>
        </p>
      ) : null}
    </div>
  );
}
