import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { StaticPage } from "@/components/content/static-page";
import { formatCm, loadPrimarySizeGuide } from "@/lib/size-guide/load";

export const metadata: Metadata = {
  title: "راهنمای سایز | پیراهن مردانه",
  description: "جدول راهنمای انتخاب سایز پیراهن مردانه",
};

const FALLBACK = [
  { size_label: "S", chest_cm: 92, neck_cm: 37.5, sleeve_cm: 62.5 },
  { size_label: "M", chest_cm: 97, neck_cm: 39.5, sleeve_cm: 63.5 },
  { size_label: "L", chest_cm: 102, neck_cm: 41.5, sleeve_cm: 64.5 },
  { size_label: "XL", chest_cm: 107.5, neck_cm: 43.5, sleeve_cm: 65.5 },
] as const;

export default async function SizeGuidePage() {
  const guide = await loadPrimarySizeGuide();
  const rows =
    guide && guide.rows.length
      ? guide.rows
      : FALLBACK.map((r) => ({
          size_label: r.size_label,
          chest_cm: r.chest_cm,
          waist_cm: null as number | null,
          shoulder_cm: null as number | null,
          sleeve_cm: r.sleeve_cm,
          length_cm: null as number | null,
          neck_cm: r.neck_cm,
        }));

  const showWaist = rows.some((r) => r.waist_cm != null);
  const showShoulder = rows.some((r) => r.shoulder_cm != null);
  const showLength = rows.some((r) => r.length_cm != null);
  const showSleeve = rows.some((r) => r.sleeve_cm != null);
  const showNeck = rows.some((r) => r.neck_cm != null);
  const showChest = rows.some((r) => r.chest_cm != null);

  return (
    <StaticPage title={guide?.name || "راهنمای سایز"}>
      <p>
        {guide?.description?.trim() ||
          "اندازه‌گیری را با متر روی بدن انجام دهید: دور سینه، دور گردن، قد و طول آستین. بین دو سایز، معمولاً سایز بزرگ‌تر برای راحتی بیشتر مناسب است."}
      </p>
      <div className="table-scroll border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[28rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2">سایز</th>
              {showChest ? <th className="p-2">سینه (cm)</th> : null}
              {showWaist ? <th className="p-2">کمر (cm)</th> : null}
              {showShoulder ? <th className="p-2">شانه (cm)</th> : null}
              {showNeck ? <th className="p-2">گردن (cm)</th> : null}
              {showSleeve ? <th className="p-2">آستین (cm)</th> : null}
              {showLength ? <th className="p-2">قد (cm)</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size_label} className="border-border border-t">
                <td className="p-2 font-medium">{row.size_label}</td>
                {showChest ? (
                  <td className="p-2 tabular-nums">{formatCm(row.chest_cm)}</td>
                ) : null}
                {showWaist ? (
                  <td className="p-2 tabular-nums">{formatCm(row.waist_cm)}</td>
                ) : null}
                {showShoulder ? (
                  <td className="p-2 tabular-nums">{formatCm(row.shoulder_cm)}</td>
                ) : null}
                {showNeck ? (
                  <td className="p-2 tabular-nums">{formatCm(row.neck_cm)}</td>
                ) : null}
                {showSleeve ? (
                  <td className="p-2 tabular-nums">{formatCm(row.sleeve_cm)}</td>
                ) : null}
                {showLength ? (
                  <td className="p-2 tabular-nums">{formatCm(row.length_cm)}</td>
                ) : null}
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
