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
      description=""
      breakout={{
        src: "/logo.png",
        alt: "پیراهن مردانه",
        title: "اندازه درست، استایل درست",
        description:
          "راهنمای سایز شفاف، تعویض آسان و پشتیبانی واقعی — برای اطمینان از فیت قبل و بعد از خرید.",
        buttonText: "مشاهده محصولات",
        buttonUrl: "/products",
      }}
      companiesTitle="دنیای تخصصی ما"
      companies={[]}
      achievementsTitle="آنچه برای شما می‌سازیم"
      achievementsDescription="تمرکز روی پیراهن و اکسسوری."
      achievements={[
        { label: "تمرکز", value: "پیراهن" },
        { label: "فیت", value: "دقیق" },
        { label: "مرجوعی", value: "آسان" },
        { label: "پشتیبانی", value: "واقعی" },
      ]}
    />
  );
}
