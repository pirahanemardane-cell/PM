import type { Metadata } from "next";
import ContactWithGlobe from "@/components/ui/contact-with-globe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تماس با ما | پیراهن مردانه",
  description: "راه‌های ارتباط با فروشگاه تخصصی پیراهن مردانه",
};

export default function ContactPage() {
  return (
    <ContactWithGlobe
      subtitle="تماس"
      title="تماس با ما"
      description="برای پشتیبانی سفارش، مرجوعی و مشاوره سایز از راه‌های زیر با ما در ارتباط باشید."
    />
  );
}
