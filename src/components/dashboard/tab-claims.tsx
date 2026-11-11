"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createWarrantyClaimAction,
  listMyOrdersForClaimAction,
  listMyWarrantyClaimsAction,
  uploadWarrantyEvidenceAction,
} from "@/app/(shop)/actions/warranty-claims";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";

const TYPE_FA: Record<string, string> = {
  warranty: "گارانتی دوخت",
  exchange: "تعویض آسان",
  stitching: "تعمیر دوخت",
};

export function TabClaims() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [claimType, setClaimType] = useState<"warranty" | "exchange" | "stitching">("warranty");
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState("");
  const [productId, setProductId] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [claims, ords] = await Promise.all([
      listMyWarrantyClaimsAction(),
      listMyOrdersForClaimAction(),
    ]);
    setLoading(false);
    if (claims.ok) setItems(claims.items);
    if (ords.ok) setOrders(ords.items);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedOrder = orders.find((o) => o.id === orderId);
  const orderProducts: { id: string; title: string }[] = [];
  if (selectedOrder?.order_items) {
    for (const it of selectedOrder.order_items as any[]) {
      const pid = it.product_id as string | undefined;
      if (!pid) continue;
      if (!orderProducts.some((p) => p.id === pid)) {
        orderProducts.push({ id: pid, title: it.title || "محصول" });
      }
    }
  }

  async function onUpload(file: File) {
    if (evidenceUrls.length >= 4) {
      setMsg("حداکثر ۴ تصویر");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadWarrantyEvidenceAction(fd);
    setUploading(false);
    if (!res.ok) {
      setMsg(
        res.error === "too_large"
          ? "حجم فایل بیش از ۳ مگابایت است"
          : res.error === "not_image"
            ? "فقط تصویر مجاز است"
            : "آپلود ناموفق",
      );
      return;
    }
    setEvidenceUrls((u) => [...u, res.url]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createWarrantyClaimAction({
      claimType,
      body,
      orderId: orderId.trim() || undefined,
      productId: productId.trim() || undefined,
      evidenceUrls,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(
        res.error === "body_short"
          ? "توضیحات کامل‌تری بنویسید"
          : res.error === "order_not_yours"
            ? "سفارش متعلق به شما نیست"
            : "ثبت ناموفق — مایگریشن ۰۶۷/۰۶۸ را اعمال کنید",
      );
      return;
    }
    setBody("");
    setOrderId("");
    setProductId("");
    setEvidenceUrls([]);
    setMsg("درخواست ثبت شد");
    void load();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-base font-bold text-primary">ادعا / گارانتی</h2>
        <p className="text-muted-foreground text-sm">
          جزئیات سیاست در{" "}
          <Link href="/گارانتی" className="underline">
            صفحه گارانتی
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="border-border space-y-3 rounded-xl border p-4">
        <select
          className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
          value={claimType}
          onChange={(e) => setClaimType(e.target.value as typeof claimType)}
        >
          <option value="warranty">گارانتی دوخت</option>
          <option value="exchange">تعویض آسان</option>
          <option value="stitching">تعمیر دوخت</option>
        </select>
        <select
          className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            setProductId("");
          }}
        >
          <option value="">انتخاب سفارش (پیشنهادی)</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {formatJalaliDate(o.created_at)} ·{" "}
              {(Number(o.total_amount) || 0).toLocaleString("fa-IR")} تومان ·{" "}
              {String(o.id).slice(0, 8)}…
            </option>
          ))}
        </select>
        {orderProducts.length ? (
          <select
            className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">محصول مرتبط (اختیاری)</option>
            {orderProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : null}
        <textarea
          className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
          rows={4}
          placeholder="توضیح مشکل…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <div className="space-y-2">
          <label className="text-muted-foreground text-xs">مدرک تصویری (اختیاری، تا ۴ فایل)</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading || evidenceUrls.length >= 4}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
            className="text-xs"
          />
          {evidenceUrls.length ? (
            <ul className="flex flex-wrap gap-2">
              {evidenceUrls.map((u) => (
                <li key={u} className="text-xs">
                  <a href={u} target="_blank" rel="noreferrer" className="underline">
                    تصویر
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {msg ? <p className="text-sm">{msg}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          ثبت ادعا
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <LumaSpin />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <article key={c.id} className="border-border rounded-xl border p-3 text-sm">
              <div className="text-muted-foreground mb-1 flex flex-wrap gap-2 text-xs">
                <span>{TYPE_FA[c.claim_type] || c.claim_type}</span>
                <span>{c.status_fa || c.status}</span>
                <span>{formatJalaliDate(c.created_at)}</span>
                {c.order_id ? (
                  <span dir="ltr">سفارش: {String(c.order_id).slice(0, 8)}…</span>
                ) : null}
                {c.product?.slug ? (
                  <Link href={`/محصولات/${c.product.slug}`} className="underline">
                    {c.product.name}
                  </Link>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
              {c.images?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.images.map((im: { url: string }, i: number) => (
                    <a
                      key={i}
                      href={im.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs underline"
                    >
                      مدرک {i + 1}
                    </a>
                  ))}
                </div>
              ) : null}
              {c.admin_note ? (
                <p className="bg-muted/40 mt-2 rounded p-2 text-xs">پاسخ: {c.admin_note}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
