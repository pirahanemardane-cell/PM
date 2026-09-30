"use client";

import { Price } from "@/components/ui/price";
import { toast } from "@/lib/toaster";
import { resolveColorHex } from "@/lib/colors";
import { sizeAvailable, sameColor, colorAvailable, isVariantAvailable } from "@/lib/variant-availability";
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useShopStore } from "@/lib/shop-store";
import { useUnifiedCart } from "@/lib/use-unified-cart";
import { removeCartItemAction, updateCartQuantityAction, swapCartVariantAction } from "@/app/(shop)/actions/shop";
import { X } from "lucide-react";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";

export type ActivityTab = "cart" | "wishlist" | "compare" | "recent" | "notifications";

const LABELS: Record<ActivityTab, string> = {
  cart: "سبد خرید",
  wishlist: "علاقه‌مندی‌ها",
  compare: "مقایسه",
  recent: "بازدیدهای اخیر",
  notifications: "اعلان‌ها",
};

export function ShopActivityDrawer({
  open,
  tab,
  onOpenChange,
}: {
  open: boolean;
  tab: ActivityTab;
  onOpenChange: (open: boolean) => void;
  onTabChange?: (tab: ActivityTab) => void;
}) {
  const cart = useShopStore((s) => s.cart);
  const { lines: unifiedLines, total: unifiedTotal, isLoggedIn } = useUnifiedCart();
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);
  const recent = useShopStore((s) => s.recentlyViewed);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const updateCartItem = useShopStore((s) => s.updateCartItem);
  const setCartQuantity = useShopStore((s) => s.setCartQuantity);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);

  const cartTotal = isLoggedIn
    ? unifiedTotal
    : cart.reduce((sum, x) => sum + (x.price ?? 0) * (x.quantity ?? 1), 0);

  const items =
    tab === "notifications"
      ? []
      : tab === "cart"
        ? (isLoggedIn ? unifiedLines : cart)
        : tab === "wishlist"
          ? wishlist
          : tab === "compare"
            ? compare
            : recent;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md fixed inset-y-0 right-0 left-auto mt-0 flex h-full w-full max-w-md flex-col rounded-none border-l bg-background" dir="rtl">
        <DrawerHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border/40 px-2">
          <DrawerTitle>{LABELS[tab]}</DrawerTitle>
          <DrawerClose className="hover:bg-primary hover:text-primary-foreground rounded-full p-2">
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>
<div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "notifications" ? (
            <NotificationsPanel onNavigate={() => onOpenChange(false)} />
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">موردی نیست.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <div
                  key={(p as { key?: string }).key ?? `${(p as { id?: string; productId?: string }).id ?? (p as { productId?: string }).productId}|${p.color ?? ""}|${p.size ?? ""}`}
                  className="flex gap-3 rounded-xl border border-border/60 bg-background p-3"
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-md object-cover aspect-square"
                      style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-md bg-muted" style={{ aspectRatio: "1 / 1" }} />
                  )}
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-medium">
                      {p.title || "محصول"}
                    </p>
                    {tab === "cart" && typeof p.price === "number" ? (
                      <div className="mt-0.5 space-y-0.5 text-xs">
                        <p className="text-muted-foreground">
                          <Price amount={p.price} size="sm" />
                          {(p.quantity ?? 1) > 1
                            ? " × " + (p.quantity ?? 1)
                            : ""}
                        </p>
                        <p className="font-medium text-foreground">
                          جمع:{" "}
                          {(
                            p.price * (p.quantity ?? 1)
                          ).toLocaleString("fa-IR")}{" "}
                          تومان
                        </p>
                      </div>
                    ) : null}
                    {tab === "cart" && (
                      <div className="mt-2 space-y-2">
                        {(() => {
                          const line = p as {
                            colors?: string[];
                            sizes?: string[];
                            colorHex?: string;
                            color?: string;
                            size?: string;
                            variantId?: string;
                            productId?: string;
                            id?: string;
                            quantity?: number;
                            source?: string;
                            variantOptions?: { color?: string; colorHex?: string; size?: string; stock: number }[];
                          };
                          const colors: string[] =
                            line.colors?.length
                              ? line.colors
                              : line.variantOptions?.length
                                ? [
                                    ...new Set(
                                      line.variantOptions
                                        .map((o) => (o.colorHex || o.color || "").trim())
                                        .filter(Boolean),
                                    ),
                                  ]
                                : line.colorHex || line.color
                                  ? [line.colorHex || line.color!]
                                  : [];
                          const sizes: string[] =
                            line.sizes?.length
                              ? line.sizes
                              : line.variantOptions?.length
                                ? [
                                    ...new Set(
                                      line.variantOptions
                                        .map((o) => (o.size || "").trim())
                                        .filter(Boolean),
                                    ),
                                  ]
                                : line.size
                                  ? [line.size]
                                  : [];
                          const currentKey = (line.colorHex || line.color || "")
                            .replace(/^#/, "")
                            .toLowerCase();

                          async function swap(patch: { size?: string; colorHex?: string; color?: string }) {
                            const nextSize = patch.size !== undefined ? patch.size : line.size;
                            const nextHex =
                              patch.colorHex !== undefined
                                ? patch.colorHex
                                : line.colorHex || (line.color?.startsWith("#") ? line.color : undefined);
                            const nextName =
                              patch.color !== undefined
                                ? patch.color
                                : line.color && !line.color.startsWith("#")
                                  ? line.color
                                  : undefined;
                            if (isLoggedIn && line.variantId && (line.productId || line.id)) {
                              const res = await swapCartVariantAction({
                                oldVariantId: line.variantId,
                                productId: line.productId || line.id!,
                                colorHex: nextHex || nextName || null,
                                size: nextSize || null,
                                quantity: line.quantity ?? 1,
                              });
                              if (!res.ok) {
                                toast.error(
                                  res.error === "variant_not_found"
                                    ? "این ترکیب موجود نیست"
                                    : res.error?.startsWith("insufficient_stock")
                                      ? "موجودی کافی نیست"
                                      : "تغییر ممکن نشد",
                                );
                                return;
                              }
                              window.dispatchEvent(new Event("pm:cart-changed"));
                              toast.success("سبد به‌روز شد");
                            } else {
                              const pid = line.productId || line.id;
                              if (!pid) return;
                              const key = `${pid}|${p.color ?? ""}|${p.size ?? ""}`;
                              updateCartItem(key, {
                                size: nextSize,
                                color: nextHex || nextName,
                              });
                            }
                          }

                          return (
                            <div className="mt-1.5 space-y-1.5">
                              {colors.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  {colors.map((c) => {
                                    const hex = resolveColorHex(c) || c;
                                    const key = c.replace(/^#/, "").toLowerCase();
                                    const active = key === currentKey;
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        title={c}
                                        onClick={() =>
                                          void swap({
                                            colorHex: c.startsWith("#") ? c : hex,
                                            color: c.startsWith("#") ? undefined : c,
                                          })
                                        }
                                        className={`h-5 w-5 rounded-full border-2 ${
                                          active
                                            ? "border-primary ring-1 ring-primary/40"
                                            : "border-black/15"
                                        }`}
                                        style={{ backgroundColor: hex || c }}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (line.colorHex || line.color) ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <span
                                    className="inline-block h-4 w-4 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor: resolveColorHex(
                                        line.colorHex || line.color,
                                      ),
                                    }}
                                  />
                                  رنگ
                                </span>
                              ) : null}
                              {sizes.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                  {sizes.map((sz) => {
                                    const active =
                                      (sz || "").toUpperCase() ===
                                      (line.size || "").toUpperCase();
                                    return (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => void swap({ size: sz })}
                                        className={`h-7 min-w-[1.75rem] rounded-md border px-1.5 text-[11px] font-medium ${
                                          active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-muted/40"
                                        }`}
                                      >
                                        {sz}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : line.size ? (
                                <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium">
                                  سایز: {line.size}
                                </span>
                              ) : null}
                            </div>
                          );
                        })()}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={async () => {
                              const line = p as {
                                id?: string;
                                productId?: string;
                                variantId?: string;
                                source?: string;
                                color?: string;
                                size?: string;
                              };
                              const isServer =
                                isLoggedIn &&
                                (line.source === "server" || Boolean(line.variantId));
                              if (isServer && line.variantId) {
                                const res = await removeCartItemAction(line.variantId);
                                if (!res.ok) {
                                  console.error("[drawer remove]", res.error);
                                  return;
                                }
                                window.dispatchEvent(new Event("pm:cart-changed"));
                                  toast.success("از سبد حذف شد");
                              } else {
                                const pid = line.productId || line.id || (p as { id?: string }).id;
                                if (pid) removeFromCart(pid, { color: p.color, size: p.size });
                              }
                            }}
                          >
                            حذف
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="border-border h-7 w-7 rounded-md border text-sm"
                              onClick={async () => {
                                const line = p as { variantId?: string; source?: string; productId?: string; id?: string };
                                const q = (p.quantity ?? 1) - 1;
                                if (isLoggedIn && (line.source === "server" || line.variantId) && line.variantId) {
                                  if (q < 1) {
                                    await removeCartItemAction(line.variantId);
                                    window.dispatchEvent(new Event("pm:cart-changed"));
                                  } else {
                                    await updateCartQuantityAction(line.variantId, q);
                                    window.dispatchEvent(new Event("pm:cart-changed"));
                                  }
                                } else {
                                  const pid = line.productId || line.id || (p as { id?: string }).id;
                                  const key = `${pid}|${p.color ?? ""}|${p.size ?? ""}`;
                                  if (q < 1) removeFromCart(pid!);
                                  else setCartQuantity(key, q);
                                }
                              }}
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm">
                              {p.quantity ?? 1}
                            </span>
                            <button
                              type="button"
                              className="border-border h-7 w-7 rounded-md border text-sm"
                              onClick={async () => {
                                const line = p as { variantId?: string; source?: string; productId?: string; id?: string };
                                const q = (p.quantity ?? 1) + 1;
                                if (isLoggedIn && (line.source === "server" || line.variantId) && line.variantId) {
                                  await updateCartQuantityAction(line.variantId, q);
                                  window.dispatchEvent(new Event("pm:cart-changed"));
                                } else {
                                  const pid = line.productId || line.id || (p as { id?: string }).id;
                                  const key = `${pid}|${p.color ?? ""}|${p.size ?? ""}`;
                                  setCartQuantity(key, q);
                                }
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {tab === "wishlist" && (
                      <button
                        type="button"
                        className="text-destructive mt-1 text-xs"
                        onClick={() => toggleWishlist(p)}
                      >
                        حذف
                      </button>
                    )}
                    {tab === "compare" && (
                      <button
                        type="button"
                        className="text-destructive mt-1 text-xs"
                        onClick={() => toggleCompare(p)}
                      >
                        حذف از مقایسه
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </ul>
          )}
        </div>

        {tab === "cart" && (isLoggedIn ? unifiedLines.length > 0 : cart.length > 0) ? (
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm font-medium">جمع کل</span>
            <span className="text-sm font-bold">
              <Price amount={cartTotal} size="md" />
            </span>
          </div>
        ) : null}

        <DrawerFooter className="shrink-0 space-y-2 border-t border-border/40">
          {tab === "cart" && (isLoggedIn ? unifiedLines.length > 0 : cart.length > 0) ? (
            <>
              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="bg-primary text-primary-foreground flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold"
              >
                تسویه حساب
              </Link>
              <Link
                href="/cart"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-muted flex h-10 w-full items-center justify-center rounded-xl border text-sm font-medium"
              >
                صفحه سبد خرید
              </Link>
            </>
          ) : null}
          <Link
            href="/dashboard"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground hover:bg-muted flex h-10 w-full items-center justify-center rounded-xl border text-sm font-medium"
          >
            مشاهده در پنل خریدار
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
