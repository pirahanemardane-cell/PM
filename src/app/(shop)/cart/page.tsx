"use client";

import { Price } from "@/components/ui/price";
import Link from "next/link";
import { useMemo, useState } from "react";
import { resolveColorHex } from "@/lib/colors";
import { useShopStore } from "@/lib/shop-store";
import { useUnifiedCart } from "@/lib/use-unified-cart";
import {
  removeCartItemAction,
  updateCartQuantityAction,
  swapCartVariantAction,
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
        colors: l.colors ?? [],
        sizes: l.sizes ?? [],
        variantOptions: l.variantOptions ?? [],
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
      colors: p.colors ?? [],
      sizes: p.sizes ?? [],
      variantOptions: [] as {
        color?: string;
        colorHex?: string;
        size?: string;
        stock: number;
      }[],
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
    patch: { size?: string; colorHex?: string; color?: string },
  ) {
    const nextSize = patch.size !== undefined ? patch.size : line.size;
    const nextHex =
      patch.colorHex !== undefined
        ? patch.colorHex
        : line.colorHex || (line.color?.startsWith("#") ? line.color : undefined);
    const nextColorName =
      patch.color !== undefined
        ? patch.color
        : line.color && !line.color.startsWith("#")
          ? line.color
          : undefined;

    // اگر همان ترکیب فعلی بود، کاری نکن
    const sameSize = (nextSize || "") === (line.size || "");
    const sameColor =
      (nextHex || nextColorName || "").replace(/^#/, "").toLowerCase() ===
      (line.colorHex || line.color || "").replace(/^#/, "").toLowerCase();
    if (sameSize && sameColor) return;

    setBusyKey(line.key);
    setMsg(null);
    try {
      if (isLoggedIn && line.variantId && line.productId) {
        const res = await swapCartVariantAction({
          oldVariantId: line.variantId,
          productId: line.productId,
          colorHex: nextHex || nextColorName || null,
          size: nextSize || null,
          quantity: line.quantity,
        });
        if (!res.ok) {
          if (res.error?.startsWith("insufficient_stock")) {
            setMsg("موجودی این ترکیب کافی نیست.");
          } else if (res.error === "variant_not_found") {
            setMsg("این ترکیب رنگ/سایز موجود نیست.");
          } else {
            setMsg("تغییر رنگ/سایز ممکن نشد.");
          }
          return;
        }
        window.dispatchEvent(new Event("pm:cart-changed"));
      } else {
        // سبد محلی (مهمان)
        updateCartItem(line.key, {
          size: nextSize,
          color: nextHex || nextColorName,
        });
      }
    } finally {
      setBusyKey(null);
    }
  }

  function availableSizes(line: (typeof lines)[number]): string[] {
    if (line.sizes?.length) return line.sizes;
    if (line.variantOptions?.length) {
      return [
        ...new Set(
          line.variantOptions
            .map((o) => (o.size || "").trim())
            .filter(Boolean),
        ),
      ];
    }
    return line.size ? [line.size] : [];
  }

  function availableColors(line: (typeof lines)[number]): string[] {
    if (line.colors?.length) return line.colors;
    if (line.variantOptions?.length) {
      const keys: string[] = [];
      for (const o of line.variantOptions) {
        const k = (o.colorHex || o.color || "").trim();
        if (!k) continue;
        if (
          !keys.some(
            (x) =>
              x.replace(/^#/, "").toLowerCase() ===
              k.replace(/^#/, "").toLowerCase(),
          )
        ) {
          keys.push(k);
        }
      }
      return keys;
    }
    const cur = line.colorHex || line.color;
    return cur ? [cur] : [];
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">سبد خرید</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اقلام انتخاب‌شده — می‌توانید رنگ، سایز و تعداد را تغییر دهید
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
              const sizes = availableSizes(p);
              const colors = availableColors(p);
              const currentColorKey = (
                p.colorHex ||
                p.color ||
                ""
              ).replace(/^#/, "").toLowerCase();

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

                    {/* رنگ */}
                    {colors.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px]">رنگ</p>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {colors.map((c) => {
                            const hex = resolveColorHex(c) || c;
                            const key = c.replace(/^#/, "").toLowerCase();
                            const active = key === currentColorKey;
                            return (
                              <button
                                key={c}
                                type="button"
                                disabled={busy}
                                title={c}
                                onClick={() =>
                                  void changeVariant(p, {
                                    colorHex: c.startsWith("#") ? c : hex,
                                    color: c.startsWith("#") ? undefined : c,
                                  })
                                }
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  active
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border hover:border-primary/50"
                                } disabled:opacity-40`}
                                style={{ backgroundColor: hex || c }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* سایز */}
                    {sizes.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px]">سایز</p>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {sizes.map((sz) => {
                            const active =
                              (sz || "").toUpperCase() ===
                              (p.size || "").toUpperCase();
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void changeVariant(p, { size: sz })
                                }
                                className={`h-8 min-w-[2.25rem] rounded-lg border px-2 text-xs font-medium transition ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50"
                                } disabled:opacity-40`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
