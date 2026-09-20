import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "ارسال و تحویل | پیراهن مردانه",
  description: "روش‌ها و زمان تقریبی ارسال سفارش‌ها",
};

export default function ShippingPage() {
  return (
    <StaticPage title="ارسال و تحویل">
      <p>
        سفارش‌ها پس از تأیید پرداخت در انبار آماده‌سازی می‌شوند. زمان تقریبی
        پردازش ۱ تا ۳ روز کاری است.
      </p>
      <p>
        هزینه و روش ارسال بر اساس شهر مقصد در مرحله تسویه‌حساب اعلام می‌شود.
        پس از تحویل به پست/تیپاکس، وضعیت از داشبورد قابل پیگیری است.
      </p>
    </StaticPage>
  );
}
