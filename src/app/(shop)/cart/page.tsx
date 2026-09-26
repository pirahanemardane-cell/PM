"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { resolveColorHex } from "@/lib/colors";
import { useShopStore } from "@/lib/shop-store";
import { useUnifiedCart } from "@/lib/use-unified-cart";
import {
  removeCartItemAction,
  updateCartQuantityAction,
} from "@/app/(shop)/actions/shop";
import { toPersianDigits } from "@/lib/numbers";
import { LumaSpin } from "@/components/ui/luma-spin";

function fmtPrice(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US")) + " تومان";
}

export default function CartPage() {
  const localCart = useShopStore((s) => s.cart);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const setCartQuantity = useShopStore((s) => s.setCartQuantity);
  const { lines: unifiedLines, total: unifiedTotal, isLoggedIn } =
    useUnifiedCart();
  const [busyKey, setBusyKey] = useState<string | null>(null);

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
    }));
  }, [isLoggedIn, unifiedLines, localCart]);

  const total =
    isLoggedIn && unifiedLines.length > 0
      ? unifiedTotal
      : lines.reduce((s, x) => s + Number(x.price) * Number(x.quantity ?? 1), 0);

  async function changeQty(line: (typeof lines)[number], next: number) {
    const q = Math.max(1, Math.min(99, Math.floor(next)));
    setBusyKey(line.key);
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">سبد خرید</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اقلام انتخاب‌شده قبل از تسویه حساب
          </p>
        </div>
        <Link
          href="/products"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          ادامه خرید
        </Link>
      </div>

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
              return (
                <li key={p.key} className="flex gap-3 p-4">
                  <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-right">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {fmtPrice(Number(p.price))}
                      {qty > 1 ? ` × ${toPersianDigits(String(qty))}` : ""}
                    </p>
                    <p className="text-xs font-medium">
                      جمع: {fmtPrice(Number(p.price) * qty)}
                    </p>
                    {(p.colorHex || p.color || p.size) && (
                      <div className="flex flex-wrap justify-end gap-2 text-[11px]">
                        {(p.colorHex || p.color) && (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border"
                              style={{
                                backgroundColor: resolveColorHex(
                                  p.colorHex || p.color,
                                ),
                              }}
                            />
                            رنگ
                          </span>
                        )}
                        {p.size ? <span>سایز: {p.size}</span> : null}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2">
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
