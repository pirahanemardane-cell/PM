import type { Metadata } from "next";
import { About3 } from "@/components/ui/about-3";

export const metadata: Metadata = {
  title: "درباره ما | پیراهن مردانه",
  description:
    "فروشگاه تخصصی پیراهن مردانه — کیفیت دوخت، راهنمای سایز شفاف و پشتیبانی واقعی",
};

export default function AboutPage() {
  return (
    <About3
      title="درباره پیراهن مردانه"
      description="ما روی یک چیز تمرکز کرده‌ایم: پیراهن مردانه با فیت درست، دوخت تمیز و تجربه خرید شفاف. هدفمان این است که قبل از خرید سایز را با اطمینان انتخاب کنید و بعد از خرید پشتیبانی واقعی داشته باشید."
      breakout={{
        src: "/logo.png",
        alt: "پیراهن مردانه",
        title: "اندازه درست، استایل درست",
        description:
          "راهنمای سایز شفاف، تعویض آسان و پشتیبانی واقعی — برای اطمینان از فیت قبل و بعد از خرید.",
        buttonText: "مشاهده محصولات",
        buttonUrl: "/products",
      }}
      companiesTitle="تمرکز ما"
      companies={[]}
      achievementsTitle="آنچه برای شما می‌سازیم"
      achievementsDescription="فروشگاه تخصصی، نه همه‌چیزفروشی."
      achievements={[
        { label: "تمرکز", value: "پیراهن" },
        { label: "فیت", value: "دقیق" },
        { label: "مرجوعی", value: "آسان" },
        { label: "پشتیبانی", value: "واقعی" },
      ]}
    />
  );
}
