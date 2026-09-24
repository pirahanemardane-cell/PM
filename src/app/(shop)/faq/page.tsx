import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "سوالات متداول | پیراهن مردانه",
  description: "پاسخ به سوالات رایج درباره سفارش، سایز، ارسال و مرجوعی",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "چطور سایز مناسب را انتخاب کنم؟",
    a: "از صفحه راهنمای سایز استفاده کنید و در صورت تردید با پشتیبانی تماس بگیرید.",
  },
  {
    q: "زمان ارسال چقدر است؟",
    a: "پس از تأیید پرداخت، معمولاً ۱ تا ۳ روز کاری پردازش و سپس ارسال انجام می‌شود. جزئیات در صفحه ارسال آمده است.",
  },
  {
    q: "شرایط مرجوعی چیست؟",
    a: "کالای استفاده‌نشده با برچسب، طبق سیاست مرجوعی قابل بازگشت است. از داشبورد می‌توانید درخواست ثبت کنید.",
  },
  {
    q: "آیا می‌توانم سفارش را پیگیری کنم؟",
    a: "پس از ورود به داشبورد، وضعیت سفارش‌ها و در صورت فعال شدن، کد رهگیری نمایش داده می‌شود.",
  },
];

export default function FaqPage() {
  return (
    <StaticPage title="سوالات متداول">
      <div className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q} className="border-border rounded-xl border p-4">
            <h2 className="mb-2 font-semibold text-primary">{item.q}</h2>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
