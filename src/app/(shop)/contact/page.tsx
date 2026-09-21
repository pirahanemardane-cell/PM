import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "تماس با ما | پیراهن مردانه",
  description: "راه‌های ارتباط با فروشگاه تخصصی پیراهن مردانه",
};

export default function ContactPage() {
  return (
    <StaticPage title="تماس با ما">
      <p>
        برای پشتیبانی سفارش، مرجوعی و مشاوره سایز از راه‌های زیر با ما در ارتباط
        باشید.
      </p>
      <ul className="list-disc space-y-2 pr-5">
        <li>
          ایمیل:{" "}
          <a
            className="text-foreground underline"
            href="mailto:info@pirahanmardane.ir"
          >
            info@pirahanmardane.ir
          </a>
        </li>
        
        <li>ساعات پاسخگویی: شنبه تا پنجشنبه، ۹ تا ۱۸</li>
      </ul>
      <p className="text-muted-foreground text-xs">
        برای تماس سریع از ایمیل استفاده کنید. شماره تلفن پس از نهایی شدن در همین صفحه اعلام می‌شود.
      </p>
    </StaticPage>
  );
}
