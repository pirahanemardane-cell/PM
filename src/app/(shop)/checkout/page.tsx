"use client";

import { normalizeIranMobile } from "@/lib/numbers";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createOrderAction,
  getCartAction,
  listMyAddressesAction,
  validateDiscountAction,
  type CartLineDTO,
} from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const clearCartLocal = useShopStore((s) => s.clearCart);

  const [items, setItems] = useState<CartLineDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [payMethod, setPayMethod] = useState<"cod" | "online">("cod");
  const [doneOrder, setDoneOrder] = useState<{ id: string; total: number } | null>(null);

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

  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0),
    [items],
  );
  const payable = discountPreview?.finalTotal ?? total;

  function goStep2() {
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("نام، موبایل و آدرس الزامی است.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("نام، موبایل و آدرس الزامی است.");
      setStep(1);
      return;
    }
    setSubmitting(true);
    const res = await createOrderAction({
      name: form.name.trim(),
      phone: normalizeIranMobile(form.phone.trim()) || form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim() || undefined,
      postal: form.postal.trim() || undefined,
      note: form.note.trim() || undefined,
      discountCode: (discountPreview?.code || discountCode).trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      if (res.error === "login_required") {
        window.location.href = "/ورود?next=/checkout";
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
    setDoneOrder({
      id: res.orderId,
      total: discountPreview?.finalTotal ?? total,
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  if (!items.length && !doneOrder) {
    return (
      <div className="w-full max-w-none space-y-4 px-4 py-16 text-center" dir="rtl">
        <p>سبد خرید خالی است.</p>
        <Link href="/products" className="text-primary underline">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  if (doneOrder) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4" dir="rtl">
        <AnimatedTicket
          ticketId={doneOrder.id}
          amount={doneOrder.total}
          cardHolder={payMethod === "cod" ? "پرداخت در محل" : "پرداخت آنلاین"}
        />
      </div>
    );
  }

  const steps = [
    { n: 1 as const, label: "آدرس" },
    { n: 2 as const, label: "پرداخت" },
    { n: 3 as const, label: "مرور و ثبت" },
  ];

  return (
    <div className="bg-surface-muted min-h-screen" dir="rtl">
      <div className="w-full max-w-none px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-primary">تسویه حساب</h1>

        {/* progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (s.n < step) setStep(s.n);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                  step === s.n
                    ? "bg-primary text-primary-foreground"
                    : step > s.n
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s.n}
              </button>
              <span className="text-muted-foreground hidden text-sm sm:inline">{s.label}</span>
              {i < steps.length - 1 ? (
                <span className="bg-border mx-1 h-px w-6 sm:w-10" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            {step === 1 ? (
              <>
                <h2 className="font-semibold text-primary">آدرس تحویل</h2>
                {savedAddresses.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">آدرس‌های ذخیره‌شده</p>
                    <ul className="space-y-2">
                      {savedAddresses.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => applyAddress(a)}
                            className={`w-full rounded-xl border p-3 text-right text-sm ${
                              selectedAddressId === a.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <span className="font-medium">{a.full_name}</span>
                            <span className="text-muted-foreground mt-1 block text-xs">
                              {a.city} — {a.address_line}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(
                  [
                    ["name", "نام و نام خانوادگی", "text"],
                    ["phone", "موبایل", "tel"],
                    ["address", "آدرس", "text"],
                    ["city", "شهر", "text"],
                    ["postal", "کد پستی", "text"],
                    ["note", "توضیحات (اختیاری)", "text"],
                  ] as const
                ).map(([key, label, type]) => (
                  <label key={key} className="block space-y-1 text-sm">
                    <span>{label}</span>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="border-input bg-background h-10 w-full rounded-xl border px-3"
                      dir="rtl"
                    />
                  </label>
                ))}

                <button
                  type="button"
                  onClick={goStep2}
                  className="bg-primary text-primary-foreground h-11 w-full rounded-xl text-sm font-medium"
                >
                  ادامه — روش پرداخت
                </button>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="font-semibold text-primary">روش پرداخت</h2>
                <div className="space-y-2">
                  {(
                    [
                      ["cod", "پرداخت در محل"],
                      ["online", "پرداخت آنلاین (به‌زودی)"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPayMethod(id)}
                      className={`w-full rounded-xl border p-4 text-right text-sm ${
                        payMethod === id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="border-border h-11 flex-1 rounded-xl border text-sm"
                  >
                    بازگشت
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-primary text-primary-foreground h-11 flex-1 rounded-xl text-sm font-medium"
                  >
                    ادامه — مرور
                  </button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-semibold text-primary">مرور و ثبت</h2>
                <div className="bg-muted/40 space-y-1 rounded-xl p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">گیرنده: </span>
                    {form.name} — {form.phone}
                  </p>
                  <p>
                    <span className="text-muted-foreground">آدرس: </span>
                    {form.city} {form.address}
                  </p>
                  <p>
                    <span className="text-muted-foreground">پرداخت: </span>
                    {payMethod === "cod" ? "در محل" : "آنلاین"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">کد تخفیف</p>
                  <div className="flex gap-2">
                    <input
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setDiscountPreview(null);
                        setDiscountError(null);
                      }}
                      placeholder="مثلاً WELCOME20"
                      className="border-input bg-background h-10 flex-1 rounded-xl border px-3 text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      disabled={discountLoading || !items.length}
                      className="border-border h-10 shrink-0 rounded-xl border px-4 text-sm"
                      onClick={async () => {
                        setDiscountLoading(true);
                        setDiscountError(null);
                        const res = await validateDiscountAction(discountCode, total);
                        setDiscountLoading(false);
                        if (!res.ok) {
                          setDiscountPreview(null);
                          setDiscountError(
                            res.error === "invalid"
                              ? "کد نامعتبر است"
                              : res.error === "exhausted"
                                ? "سقف استفاده تمام شده"
                                : res.error === "min_order"
                                  ? "حداقل مبلغ سفارش رعایت نشده"
                                  : "خطا در بررسی کد",
                          );
                          return;
                        }
                        setDiscountPreview(res.discount);
                      }}
                    >
                      {discountLoading ? "…" : "اعمال"}
                    </button>
                  </div>
                  {discountError ? (
                    <p className="text-destructive text-xs">{discountError}</p>
                  ) : null}
                  {discountPreview ? (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {discountPreview.discountAmount.toLocaleString("fa-IR")} تومان تخفیف —
                      قابل پرداخت: {discountPreview.finalTotal.toLocaleString("fa-IR")} تومان
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="border-border h-11 flex-1 rounded-xl border text-sm"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-primary-foreground h-11 flex-1 rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? "در حال ثبت…" : "ثبت نهایی سفارش"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          {/* خلاصه سبد */}
          <aside className="border-border bg-card h-fit rounded-2xl border p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-primary">سبد خرید</h2>
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.itemId || it.variantId} className="flex justify-between gap-3 text-sm">
                  <span>
                    {it.title}
                    <span className="text-muted-foreground"> × {it.quantity}</span>
                  </span>
                  <span className="shrink-0">
                    {(Number(it.price) * Number(it.quantity)).toLocaleString("fa-IR")}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-border mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">جمع</span>
                <span>{total.toLocaleString("fa-IR")} تومان</span>
              </div>
              {discountPreview ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>تخفیف</span>
                  <span>
                    −{discountPreview.discountAmount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold">
                <span>قابل پرداخت</span>
                <span>{payable.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
