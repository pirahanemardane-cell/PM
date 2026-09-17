"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useShopStore } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "cart", label: "سبد خرید" },
  { id: "wishlist", label: "علاقه‌مندی‌ها" },
  { id: "compare", label: "مقایسه" },
  { id: "recent", label: "بازدید اخیر" },
  { id: "orders", label: "سفارش‌ها" },
  { id: "profile", label: "پروفایل" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BuyerDashboardPage() {
  const [tab, setTab] = useState<TabId>("cart");
  const cart = useShopStore((s) => s.cart);
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);
  const recent = useShopStore((s) => s.recentlyViewed);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);

  const counts = useMemo(
    () => ({
      cart: cart.length,
      wishlist: wishlist.length,
      compare: compare.length,
      recent: recent.length,
    }),
    [cart, wishlist, compare, recent]
  );

  function listFor(tabId: TabId) {
    if (tabId === "cart") return cart;
    if (tabId === "wishlist") return wishlist;
    if (tabId === "compare") return compare;
    if (tabId === "recent") return recent;
    return [];
  }

  const items = listFor(tab);

  return (
    <div className="bg-surface-muted min-h-screen" dir="rtl">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        {/* ستون کناری */}
        <aside className="border-border bg-card h-fit rounded-2xl border p-4 shadow-sm">
          <h1 className="mb-4 text-lg font-bold">پنل خریدار</h1>
          <nav className="space-y-1">
            {TABS.map((t) => {
              const c =
                t.id === "cart"
                  ? counts.cart
                  : t.id === "wishlist"
                    ? counts.wishlist
                    : t.id === "compare"
                      ? counts.compare
                      : t.id === "recent"
                        ? counts.recent
                        : 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm",
                    tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <span>{t.label}</span>
                  {c > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-2 text-[11px]",
                        tab === t.id ? "bg-background/20" : "bg-muted"
                      )}
                    >
                      {c}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* محتوا */}
        <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
            <Link href="/محصولات" className="text-primary text-sm hover:underline">
              ادامه خرید
            </Link>
          </div>

          {tab === "orders" ? (
            <p className="text-muted-foreground text-sm">هنوز سفارشی ثبت نشده است.</p>
          ) : tab === "profile" ? (
            <div className="space-y-2 text-sm">
              <p>حساب خریدار</p>
              <p className="text-muted-foreground">از صفحه ورود/عضویت وارد شده‌اید.</p>
              <Link href="/ورود" className="text-primary hover:underline">
                مدیریت ورود
              </Link>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">موردی در این بخش نیست.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {p.brand ? `${p.brand} · ` : ""}
                      {p.price.toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tab === "cart" ? (
                      <button
                        type="button"
                        className="text-destructive text-xs"
                        onClick={() => removeFromCart(p.id)}
                      >
                        حذف از سبد
                      </button>
                    ) : null}
                    {tab === "wishlist" ? (
                      <button
                        type="button"
                        className="text-destructive text-xs"
                        onClick={() => toggleWishlist(p)}
                      >
                        حذف
                      </button>
                    ) : null}
                    {tab === "compare" ? (
                      <button
                        type="button"
                        className="text-destructive text-xs"
                        onClick={() => toggleCompare(p)}
                      >
                        حذف از مقایسه
                      </button>
                    ) : null}
                    {p.href ? (
                      <Link href={p.href} className="text-primary text-xs hover:underline">
                        مشاهده
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
