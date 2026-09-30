"use client";

import { Price } from "@/components/ui/price";
import Link from "next/link";
import { useMemo, useState } from "react";
import { resolveColorHex } from "@/lib/colors";
import {
  sizeAvailable,
  colorAvailable,
  sameColor,
  colorNorm,
} from "@/lib/variant-availability";
import { useShopStore } from "@/lib/shop-store";
import { useUnifiedCart } from "@/lib/use-unified-cart";
import {
  removeCartItemAction,
  updateCartQuantityAction,
  swapCartVariantAction,
} from "@/app/(shop)/actions/shop";
import { toPersianDigits } from "@/lib/numbers";
import { LumaSpin } from "@/components/ui/luma-spin";

type VOpt = {
  color?: string;
  colorHex?: string;
  size?: string;
  stock: number;
};

function fmtPrice(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US")) + " تومان";
}

/** لیست رنگ‌های یکتا فقط از variantOptions واقعی */
function colorsFromOpts(opts: VOpt[]): string[] {
  const out: string[] = [];
  for (const o of opts) {
    const k = (o.colorHex || o.color || "").trim();
    if (!k) continue;
    if (!out.some((x) => colorNorm(x) === colorNorm(k))) out.push(k);
  }
  return out;
}

/** لیست سایزهای یکتا فقط از variantOptions واقعی */
function sizesFromOpts(opts: VOpt[]): string[] {
  return [
    ...new Set(opts.map((o) => (o.size || "").trim()).filter(Boolean)),
  ];
}

/** تبدیل به شکل VariantLike برای sizeAvailable / colorAvailable */
function toVariantLikes(opts: VOpt[]) {
  return opts.map((o, i) => ({
    id: String(i),
    size: o.size || null,
    color: o.colorHex || o.color || null,
    stock: o.stock,
  }));
}

export default function CartPage() {
  const localCart = useShopStore((s) => s.cart);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const setCartQuantity = useShopStore((s) => s.setCartQuantity);
  const updateCartItem = useShopStore((s) => s.updateCartItem);
  const { lines: unifiedLines, total: unifiedTotal, isLoggedIn } =
    useUnifiedCart();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const lines = useMemo(() => {
    if (isLoggedIn && unifiedLines.length > 0) {
      return unifiedLines.map((l) => ({
        key: l.key,
        productId: l.productId,
        variantId: l.variantId,
        title: l.title || "محصول",
        price: l.price ?? 0,
        quantity: l.quantity ?? 1,
        image: l.image,
        size: l.size,
        color: l.color,
        colorHex: l.colorHex,
        variantOptions: (l.variantOptions ?? []) as VOpt[],
      }));
    }
    return localCart.map((p) => ({
      key: `${p.id}|${p.color ?? ""}|${p.size ?? ""}`,
      productId: p.id,
      variantId: p.variantId as string | undefined,
      title: p.title || "محصول",
      price: p.price ?? 0,
      quantity: p.quantity ?? 1,
      image: p.image,
      size: p.size,
      color: p.color?.startsWith("#") ? undefined : p.color,
      colorHex: p.color?.startsWith("#") ? p.color : undefined,
      variantOptions: [] as VOpt[],
    }));
  }, [isLoggedIn, unifiedLines, localCart]);

  const total =
    isLoggedIn && unifiedLines.length > 0
      ? unifiedTotal
      : lines.reduce((s, x) => s + Number(x.price) * Number(x.quantity ?? 1), 0);

  async function changeQty(line: (typeof lines)[number], next: number) {
    const q = Math.max(1, Math.min(99, Math.floor(next)));
    setBusyKey(line.key);
    setMsg(null);
    try {
      if (isLoggedIn && line.variantId) {
        const res = await updateCartQuantityAction(line.variantId, q);
        if (res.ok) window.dispatchEvent(new Event("pm:cart-changed"));
      } else {
        setCartQuantity(line.key, q);
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function removeLine(line: (typeof lines)[number]) {
    setBusyKey(line.key);
    setMsg(null);
    try {
      if (isLoggedIn && line.variantId) {
        await removeCartItemAction(line.variantId);
        window.dispatchEvent(new Event("pm:cart-changed"));
      } else {
        removeFromCart(line.productId, {
          size: line.size,
          color: line.colorHex || line.color,
        });
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function changeVariant(
    line: (typeof lines)[number],
    patch: { size?: string; colorKey?: string },
  ) {
    const opts = line.variantOptions;
    const likes = toVariantLikes(opts);
    const nextColor =
      patch.colorKey !== undefined
        ? patch.colorKey
        : line.colorHex || line.color || null;
    const nextSize =
      patch.size !== undefined ? patch.size : line.size || null;

    // فقط اگر این ترکیب در واریانت‌های تعریف‌شده باشد
    if (opts.length) {
      const okCombo = likes.some((v) => {
        const colorOk =
          !nextColor || !v.color || sameColor(v.color, nextColor);
        const sizeOk = !nextSize || !v.size || v.size === nextSize;
        return colorOk && sizeOk && (v.stock ?? 0) > 0;
      });
      if (!okCombo) {
        setMsg("این ترکیب رنگ/سایز برای این محصول تعریف نشده یا موجود نیست.");
        return;
      }
    }

    setBusyKey(line.key);
    setMsg(null);
    try {
      if (isLoggedIn && line.variantId && line.productId) {
        const res = await swapCartVariantAction({
          oldVariantId: line.variantId,
          productId: line.productId,
          colorHex: nextColor,
          size: nextSize,
          quantity: line.quantity,
        });
        if (!res.ok) {
          setMsg(
            res.error === "variant_not_found"
              ? "این ترکیب تعریف نشده است."
              : res.error?.startsWith("insufficient_stock")
                ? "موجودی این ترکیب کافی نیست."
                : "تغییر ممکن نشد.",
          );
          return;
        }
        window.dispatchEvent(new Event("pm:cart-changed"));
      } else {
        updateCartItem(line.key, {
          size: nextSize || undefined,
          color: nextColor || undefined,
        });
      }
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">سبد خرید</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            فقط رنگ و سایزهایی که برای هر محصول تعریف شده‌اند قابل انتخاب‌اند
          </p>
        </div>
        <Link
          href="/products"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          ادامه خرید
        </Link>
      </div>

      {msg ? (
        <p className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {lines.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border px-6 py-16 text-center">
          <p className="text-muted-foreground mb-4 text-sm">سبد خرید خالی است.</p>
          <Link
            href="/products"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium"
          >
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <>
          <ul className="border-border divide-y rounded-2xl border">
            {lines.map((p) => {
              const qty = Number(p.quantity ?? 1);
              const busy = busyKey === p.key;
              const opts = p.variantOptions;
              const likes = toVariantLikes(opts);
              const colors = colorsFromOpts(opts);
              const sizes = sizesFromOpts(opts);
              const currentColor = p.colorHex || p.color || null;
              const currentSize = p.size || null;

              return (
                <li key={p.key} className="flex gap-3 p-4">
                  <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 text-right">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {fmtPrice(Number(p.price))}
                      {qty > 1 ? ` × ${toPersianDigits(String(qty))}` : ""}
                    </p>
                    <p className="text-xs font-medium">
                      جمع: {fmtPrice(Number(p.price) * qty)}
                    </p>

                    {/* رنگ — فقط از واریانت‌های تعریف‌شده */}
                    {colors.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px]">رنگ</p>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {colors.map((c) => {
                            const hex = resolveColorHex(c) || c;
                            const active = sameColor(c, currentColor);
                            const ok = colorAvailable(c, likes, currentSize);
                            return (
                              <button
                                key={c}
                                type="button"
                                disabled={busy || !ok}
                                title={
                                  ok
                                    ? c
                                    : `این رنگ با سایز ${currentSize || "—"} تعریف نشده`
                                }
                                onClick={() =>
                                  ok && void changeVariant(p, { colorKey: c })
                                }
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  active
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border"
                                } ${!ok ? "cursor-not-allowed opacity-30" : ""}`}
                                style={{ backgroundColor: hex || c }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : currentColor ? (
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border"
                          style={{
                            backgroundColor: resolveColorHex(currentColor),
                          }}
                        />
                        رنگ
                      </span>
                    ) : null}

                    {/* سایز — فقط سایزهای معتبر برای رنگ فعلی */}
                    {sizes.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px]">سایز</p>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {sizes.map((sz) => {
                            const active =
                              (sz || "").toUpperCase() ===
                              (currentSize || "").toUpperCase();
                            const ok = sizeAvailable(sz, likes, currentColor);
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={busy || !ok}
                                title={
                                  ok
                                    ? sz
                                    : `سایز ${sz} برای این رنگ تعریف نشده`
                                }
                                onClick={() =>
                                  ok && void changeVariant(p, { size: sz })
                                }
                                className={`h-8 min-w-[2.25rem] rounded-lg border px-2 text-xs font-medium transition ${
                                  active && ok
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border"
                                } ${
                                  !ok
                                    ? "cursor-not-allowed opacity-35 line-through"
                                    : ""
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : currentSize ? (
                      <span className="text-[11px]">سایز: {currentSize}</span>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <div className="border-border flex items-center rounded-lg border">
                        <button
                          type="button"
                          disabled={busy || qty <= 1}
                          className="h-8 w-8 disabled:opacity-40"
                          onClick={() => void changeQty(p, qty - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm">
                          {toPersianDigits(String(qty))}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          className="h-8 w-8 disabled:opacity-40"
                          onClick={() => void changeQty(p, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-destructive text-xs"
                        onClick={() => void removeLine(p)}
                      >
                        حذف
                      </button>
                      {busy ? (
                        <span className="scale-75">
                          <LumaSpin />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div>
              <p className="text-muted-foreground text-xs">جمع کل</p>
              <p className="text-lg font-bold text-primary">{fmtPrice(total)}</p>
            </div>
            <Link
              href="/checkout"
              className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-xl px-6 text-sm font-bold"
            >
              تسویه حساب
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
