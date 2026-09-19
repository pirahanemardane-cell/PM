"use client";

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
import { X } from "lucide-react";

export type ActivityTab = "cart" | "wishlist" | "compare" | "recent";

const LABELS: Record<ActivityTab, string> = {
  cart: "سبد خرید",
  wishlist: "علاقه‌مندی‌ها",
  compare: "مقایسه",
  recent: "بازدیدهای اخیر",
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
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);
  const recent = useShopStore((s) => s.recentlyViewed);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);

  const items =
    tab === "cart"
      ? cart
      : tab === "wishlist"
        ? wishlist
        : tab === "compare"
          ? compare
          : recent;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full max-h-none rounded-none" dir="rtl">
        <DrawerHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/40">
          <DrawerTitle>{LABELS[tab]}</DrawerTitle>
          <DrawerClose className="hover:bg-primary hover:text-primary-foreground rounded-full p-2">
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">موردی نیست.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((p: { id: string; title: string; price?: number }) => (
                <li key={p.id} className="border-border rounded-xl border p-3">
                  <p className="text-sm font-medium">{p.title}</p>
                  {typeof p.price === "number" ? (
                    <p className="text-muted-foreground text-xs">
                      {p.price.toLocaleString("fa-IR")} تومان
                    </p>
                  ) : null}
                  <div className="mt-2">
                    {tab === "cart" && (
                      <button type="button" className="text-destructive text-xs" onClick={() => removeFromCart(p.id)}>
                        حذف از سبد
                      </button>
                    )}
                    {tab === "wishlist" && (
                      <button type="button" className="text-destructive text-xs" onClick={() => toggleWishlist(p as never)}>
                        حذف
                      </button>
                    )}
                    {tab === "compare" && (
                      <button type="button" className="text-destructive text-xs" onClick={() => toggleCompare(p as never)}>
                        حذف از مقایسه
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DrawerFooter>
          <Link
            href="/dashboard"
            onClick={() => onOpenChange(false)}
            className="bg-primary text-primary-foreground flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium"
          >
            مشاهده در پنل خریدار
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
