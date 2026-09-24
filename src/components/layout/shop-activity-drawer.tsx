"use client";
import { toast } from "@/lib/toaster";
import { resolveColorHex } from "@/lib/colors";
import { sizeAvailable, sameColor } from "@/lib/variant-availability";

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
                      alt={p.title || ""}
                      className="h-16 w-16 shrink-0 rounded-md object-contain bg-muted overflow-hidden"
                    />
                  ) : (
                    <div className="box-border h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted p-0" />
                  )}
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-medium">
                      {p.title || "محصول"}
                    </p>
                    {typeof p.price === "number" ? (
                      <div className="mt-0.5 space-y-0.5 text-xs">
                        <p className="text-muted-foreground">
                          {p.price.toLocaleString("fa-IR")} تومان
                          {tab === "cart" && (p.quantity ?? 1) > 1
                            ? " × " + (p.quantity ?? 1)
                            : ""}
                        </p>
                        {tab === "cart" ? (
                          <p className="font-medium text-foreground">
                            جمع:{" "}
                            {(
                              p.price * (p.quantity ?? 1)
                            ).toLocaleString("fa-IR")}{" "}
                            تومان
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {tab === "cart" && (
                      <div className="mt-2 space-y-2">
                        {(() => {
                          const line = p as {
                            colors?: string[];
                            color?: string;
                            colorHex?: string;
                            sizes?: string[];
                            size?: string;
                            id?: string;
                            productId?: string;
                            source?: string;
                          };
                          const rawColors = Array.isArray(line.colors) ? line.colors : [];
                          const current =
                            line.colorHex ||
                            (line.color?.startsWith("#") ? line.color : line.color) ||
                            "";
                          const colorList = [
                            ...new Set(
                              [...rawColors, current]
                                .filter(Boolean)
                                .map((c) => resolveColorHex(String(c))),
                            ),
                          ];
                          const sizeList: string[] = Array.isArray(line.sizes)
                            ? line.sizes
                            : line.size
                              ? [line.size]
                              : [];
                          const selectedHex = resolveColorHex(
                            line.colorHex || line.color,
                          );
                          const selectedSize = line.size || "";
                          const pid = line.productId || line.id || "";
                          const isServer =
                            Boolean(isLoggedIn) &&
                            (line.source === "server" ||
                              Boolean((p as { variantId?: string }).variantId));

                          return (
                            <>
                              {colorList.length > 0 ? (
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  {colorList.map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      title={c}
                                      className={
                                        "h-5 w-5 rounded-full border-2 shadow-sm " +
                                        (selectedHex.toLowerCase() ===
                                        c.toLowerCase()
                                          ? "border-primary ring-1 ring-primary ring-offset-1"
                                          : "border-black/20 opacity-80")
                                      }
                                      style={{ backgroundColor: c }}
                                      onClick={async () => {
                                        if (
                                          selectedHex.toLowerCase() ===
                                          c.toLowerCase()
                                        )
                                          return;
                                        if (isServer) {
                                          const vid = (p as { variantId?: string }).variantId;
                                          if (!vid || !pid) return;
                                          const res = await swapCartVariantAction({
                                            oldVariantId: vid,
                                            productId: pid,
                                            colorHex: c,
                                            size: selectedSize || null,
                                            quantity: p.quantity ?? 1,
                                          });
                                          if (!res.ok) {
                                            toast.error(
                                              res.error === "out_of_stock"
                                                ? "این ترکیب موجود نیست"
                                                : "تغییر رنگ ناموفق بود",
                                            );
                                            return;
                                          }
                                          window.dispatchEvent(new Event("pm:cart-changed"));
                                          toast.success("رنگ به‌روز شد");
                                          return;
                                        }
                                        const key = `${pid}|${p.color ?? ""}|${p.size ?? ""}`;
                                        updateCartItem(key, { color: c });
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : null}
                              {sizeList.length > 0 ? (
                                <div className="flex flex-wrap justify-end gap-1">
                                  {sizeList.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      className={
                                        "min-w-[1.75rem] rounded-md border px-1.5 py-0.5 text-[11px] " +
                                        (selectedSize === s
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-muted/50")
                                      }
                                      onClick={async () => {
                                        if (selectedSize === s) return;
                                        if (isServer) {
                                          const vid = (p as { variantId?: string }).variantId;
                                          if (!vid || !pid) return;
                                          const res = await swapCartVariantAction({
                                            oldVariantId: vid,
                                            productId: pid,
                                            colorHex: selectedHex || null,
                                            size: s,
                                            quantity: p.quantity ?? 1,
                                          });
                                          if (!res.ok) {
                                            toast.error(
                                              res.error === "out_of_stock"
                                                ? "این ترکیب موجود نیست"
                                                : "تغییر سایز ناموفق بود",
                                            );
                                            return;
                                          }
                                          window.dispatchEvent(new Event("pm:cart-changed"));
                                          toast.success("سایز به‌روز شد");
                                          return;
                                        }
                                        const key = `${pid}|${p.color ?? ""}|${p.size ?? ""}`;
                                        updateCartItem(key, { size: s });
                                      }}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </>
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
              {cartTotal.toLocaleString("fa-IR")} تومان
            </span>
          </div>
        ) : null}

        <DrawerFooter className="shrink-0 space-y-2 border-t border-border/40">
          {tab === "cart" && (isLoggedIn ? unifiedLines.length > 0 : cart.length > 0) ? (
            <Link
              href="/checkout"
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold"
            >
              تسویه حساب
            </Link>
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
