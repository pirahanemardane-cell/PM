"use client";
import { toast } from "@/lib/toaster";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCartAction,
  createOrderAction,
  type CartLineDTO,
  listMyAddressesAction,
  validateDiscountAction} from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";

export default function CheckoutPage() {
  const clearCartLocal = useShopStore((s) => s.clearCart);
  const [items, setItems] = useState<CartLineDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postal: "",
    note: "",
  });


  const [savedAddresses, setSavedAddresses] = useState<
    {
      id: string;
      title: string | null;
      full_name: string;
      phone: string;
      province: string | null;
      city: string;
      address_line: string;
      postal_code: string | null;
      is_default: boolean;
    }[]
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPreview, setDiscountPreview] = useState<{
    code: string;
    discountAmount: number;
    finalTotal: number;
    type: string;
    value: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getCartAction();
      if (res.ok) setItems(res.items);
      setLoading(false);
    })();
  }, []);

  function applyAddress(a: {
    id: string;
    full_name: string;
    phone: string;
    province: string | null;
    city: string;
    address_line: string;
    postal_code: string | null;
  }) {
    setSelectedAddressId(a.id);
    setForm((f) => ({
      ...f,
      name: a.full_name || f.name,
      phone: a.phone || f.phone,
      address: a.address_line || f.address,
      city: a.city || f.city,
      postal: a.postal_code || f.postal,
    }));
  }

  useEffect(() => {
    (async () => {
      const res = await listMyAddressesAction();
      if (!res.ok || !res.items?.length) return;
      setSavedAddresses(res.items as typeof savedAddresses);
      const def =
        res.items.find((x: { is_default?: boolean }) => x.is_default) ??
        res.items[0];
      if (def) applyAddress(def as Parameters<typeof applyAddress>[0]);
    })();
  }, []);


  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("نام، موبایل و آدرس الزامی است.");
      return;
    }
    setSubmitting(true);
    const res = await createOrderAction({
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim() || undefined,
      postal: form.postal.trim() || undefined,
      note: form.note.trim() || undefined,
      discountCode: discountPreview?.code || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      if (res.error === "login_required") {
        window.location.href = "/login";
        return;
      }
      if (res.error === "empty_cart") {
        setError("سبد خرید خالی است.");
        return;
      }
      setError(res.error ? `خطا: ${res.error}` : "ثبت سفارش ناموفق بود.");
      return;
    }
    clearCartLocal();
    window.location.href = `/dashboard?tab=orders&order=${res.orderId}`;
  }

  if (loading) {
  
  useEffect(() => {
    (async () => {
      const res = await listMyAddressesAction();
      if (!res.ok) return;
      setSavedAddresses(res.items as typeof savedAddresses);
      const def = res.items.find((a: { is_default?: boolean }) => a.is_default) ?? res.items[0];
      if (def) {
        setSelectedAddressId(def.id);
        // پر کردن فرم — نام فیلدها را در مرحله بعد با state واقعی جفت می‌کنیم
      }
    })();
  }, []);

  return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" dir="rtl">
        در حال بارگذاری…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center" dir="rtl">
        <p>سبد خرید خالی است.</p>
        <Link href="/products" className="text-primary underline">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-muted min-h-screen" dir="rtl">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm">

          {savedAddresses.length > 0 ? (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium">آدرس‌های ذخیره‌شده</p>
              <ul className="space-y-2">
                {savedAddresses.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => applyAddress(a)}
                      className={`w-full rounded-xl border p-3 text-right text-sm transition ${
                        selectedAddressId === a.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-medium">
                        {a.title || "آدرس"}
                        {a.is_default ? " · پیش‌فرض" : ""}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {a.full_name} — {a.phone}
                        <br />
                        {[a.province, a.city].filter(Boolean).join("، ")}
                        {a.address_line ? ` — ${a.address_line}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">
                یا فرم زیر را دستی پر کنید.
              </p>
            </div>
          ) : null}

          <h1 className="text-xl font-bold">تکمیل سفارش</h1>
          <div>
            <label className="mb-1 block text-sm">نام گیرنده *</label>
            <input
              className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">موبایل *</label>
            <input
              className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">آدرس *</label>
            <textarea
              className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">شهر</label>
              <input
                className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">کد پستی</label>
              <input
                className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
                value={form.postal}
                onChange={(e) => setForm((f) => ({ ...f, postal: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">توضیحات</label>
            <textarea
              className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          
          <div className="border-border space-y-2 rounded-xl border p-4">
            <p className="text-sm font-medium">کد تخفیف</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  setDiscountError(null);
                }}
                placeholder="مثلاً WELCOME20"
                className="border-border bg-background h-11 flex-1 rounded-xl border px-3 text-sm"
                dir="ltr"
              />
              <button
                type="button"
                disabled={discountLoading || !items.length}
                className="border-border h-11 rounded-xl border px-4 text-sm font-medium disabled:opacity-50"
                onClick={async () => {
                  setDiscountLoading(true);
                  setDiscountError(null);
                  setDiscountPreview(null);
                  const res = await validateDiscountAction(discountCode, total);
                  setDiscountLoading(false);
                  if (!res.ok) {
                    const map: Record<string, string> = {
                      empty: "کد را وارد کنید.",
                      invalid: "کد نامعتبر است.",
                      expired: "این کد منقضی شده.",
                      exhausted: "سقف استفاده از این کد تمام شده.",
                      not_started: "این کد هنوز فعال نیست.",
                      min_order: "مبلغ سبد به حداقل لازم نرسیده.",
                      empty_cart: "سبد خالی است.",
                      server: "خطای سرور.",
                    };
                    const msg = map[res.error] || "کد قابل اعمال نیست.";
                    setDiscountError(msg);
                    toast.error(msg);
                    return;
                  }
                  setDiscountPreview(res.discount);
                  toast.success("تخفیف اعمال شد");
                }}
              >
                {discountLoading ? "…" : "اعمال"}
              </button>
            </div>
            {discountError ? (
              <p className="text-destructive text-xs">{discountError}</p>
            ) : null}
            {discountPreview ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {discountPreview.discountAmount.toLocaleString("fa-IR")} تومان تخفیف
                {" · "}
                قابل پرداخت: {discountPreview.finalTotal.toLocaleString("fa-IR")} تومان
              </p>
            ) : null}
          </div>

<button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 w-full rounded-xl py-3 text-sm font-medium"
          >
            {submitting ? "در حال ثبت…" : "ثبت سفارش"}
          </button>
        </form>

        <div className="border-border bg-card h-fit space-y-3 rounded-2xl border p-6 shadow-sm">
          <h2 className="font-bold">خلاصه سبد</h2>
          <ul className="space-y-3">
            {items.map((line) => (
              <li key={line.variantId} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{line.title}</span>
                  <span className="text-muted-foreground block text-xs">
                    <span className="inline-flex items-center gap-2">
                      {line.colorHex || (line.color && line.color.startsWith("#") ? line.color : null) ? (
                        <span
                          className="border-border inline-block h-3.5 w-3.5 rounded-full border"
                          style={{
                            backgroundColor:
                              line.colorHex ||
                              (line.color?.startsWith("#") ? line.color : undefined),
                          }}
                          title={line.color && !line.color.startsWith("#") ? line.color : ""}
                        />
                      ) : null}
                      {line.size ? (
                        <span className="border-border rounded border px-1.5 py-0.5 text-[11px] font-medium">
                          {line.size}
                        </span>
                      ) : null}
                      {line.color && !String(line.color).startsWith("#") ? line.color : null}
                    </span>
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {(line.price * line.quantity).toLocaleString("fa-IR")} ت
                </span>
              </li>
            ))}
          </ul>
          <div className="border-border flex justify-between border-t pt-3 font-bold">
            <span>جمع</span>
            <span>{total.toLocaleString("fa-IR")} تومان</span>
          </div>
          <Link href="/dashboard" className="text-primary text-xs hover:underline">
            ویرایش سبد در داشبورد
          </Link>
        </div>
      </div>
    </div>
  );
}
