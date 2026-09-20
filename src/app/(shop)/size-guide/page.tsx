import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const metadata: Metadata = {
  title: "راهنمای سایز | پیراهن مردانه",
  description: "جدول راهنمای انتخاب سایز پیراهن مردانه",
};

export default function SizeGuidePage() {
  return (
    <StaticPage title="راهنمای سایز">
      <p>
        اندازه‌گیری را با متر روی بدن انجام دهید: دور سینه، دور گردن، قد و طول
        آستین. بین دو سایز، معمولاً سایز بزرگ‌تر برای راحتی بیشتر مناسب است.
      </p>
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[28rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2">سایز</th>
              <th className="p-2">سینه (cm)</th>
              <th className="p-2">گردن (cm)</th>
              <th className="p-2">آستین تقریبی</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["S", "۹۰–۹۴", "۳۷–۳۸", "۶۲–۶۳"],
              ["M", "۹۵–۹۹", "۳۹–۴۰", "۶۳–۶۴"],
              ["L", "۱۰۰–۱۰۴", "۴۱–۴۲", "۶۴–۶۵"],
              ["XL", "۱۰۵–۱۱۰", "۴۳–۴۴", "۶۵–۶۶"],
            ].map((row) => (
              <tr key={row[0]} className="border-border border-t">
                {row.map((c) => (
                  <td key={c} className="p-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs">
        جدول تقریبی است؛ جزئیات هر محصول روی صفحه کالا اولویت دارد.
      </p>
    </StaticPage>
  );
}
