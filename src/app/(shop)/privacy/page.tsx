import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "حریم خصوصی | پیراهن مردانه",
  description: "نحوه جمع‌آوری و استفاده از اطلاعات کاربران",
};

export default function PrivacyPage() {
  return (
    <StaticPage title="حریم خصوصی">
      <p>
        اطلاعات تماس، آدرس ارسال و سابقه سفارش فقط برای پردازش خرید، پشتیبانی و
        الزامات قانونی استفاده می‌شود.
      </p>
      <p>
        رمزها و کلیدهای سرویس‌های پرداخت/پیامک هرگز در مرورگر شما ذخیره یا نمایش
        داده نمی‌شوند. دسترسی کارکنان به داده‌ها حداقل و مبتنی بر نقش است.
      </p>
      <p>
        برای درخواست حذف یا اصلاح اطلاعات، از طریق صفحه تماس با ما پیام بگذارید.
      </p>
    </StaticPage>
  );
}
