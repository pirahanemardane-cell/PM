import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "سیاست مرجوعی | پیراهن مردانه",
  description: "شرایط بازگرداندن و تعویض کالا",
};

export default function ReturnsPolicyPage() {
  return (
    <StaticPage title="سیاست مرجوعی">
      <p>
        کالای استفاده‌نشده، بدون آسیب و با برچسب اصلی، در بازه اعلام‌شده پس از
        تحویل قابل درخواست مرجوعی یا تعویض است.
      </p>
      <p>
        کاربران واردشده می‌توانند از{" "}
        <Link href="/dashboard" className="text-foreground underline">
          داشبورد
        </Link>{" "}
        برای سفارش‌های خود درخواست مرجوعی ثبت کنند.
      </p>
      <p>
        هزینه بازگشت در موارد نقص کالا با فروشگاه است؛ در سایر موارد طبق قوانین
        اعلامی در زمان ثبت درخواست مشخص می‌شود.
      </p>
    </StaticPage>
  );
}
