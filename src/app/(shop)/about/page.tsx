import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "درباره ما | پیراهن مردانه",
  description:
    "فروشگاه تخصصی پیراهن مردانه، کروات، پاپیون، دکمه سردست و اکسسوری استایل رسمی",
};

export default function AboutPage() {
  return (
    <StaticPage title="درباره ما">
      <p>
        «پیراهن مردانه» فروشگاهی تخصصی برای استایل رسمی و نیمه‌رسمی آقایان است:
        پیراهن، کروات، پاپیون، دکمه سردست و اکسسوری‌های مکمل.
      </p>
      <p>
        تمرکز ما روی کیفیت دوخت، راهنمای سایز شفاف، ارسال مطمئن و پشتیبانی واقعی
        پس از خرید است — نه فروش عمومی پوشاک.
      </p>
    </StaticPage>
  );
}
