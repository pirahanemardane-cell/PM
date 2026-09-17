"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useShopStore } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

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
    () => ({ cart: cart.length, wishlist: wishlist.length, compare: compare.length, recent: recent.length }),
    [cart, wishlist, compare, recent]
  );

  const items =
    tab === "cart" ? cart : tab === "wishlist" ? wishlist : tab === "compare" ? compare : tab === "recent" ? recent : [];

  return (
    <div className="bg-surface-muted min-h-screen" dir="rtl">
      <AppBreadcrumb items={[{ label: "پنل خریدار" }]} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="border-border bg-card h-fit rounded-2xl border p-4 shadow-sm">
          <h1 className="mb-4 text-lg font-bold">پنل خریدار</h1>
          <nav className="space-y-1">
            {TABS.map((t) => {
              const c = t.id === "cart" ? counts.cart : t.id === "wishlist" ? counts.wishlist : t.id === "compare" ? counts.compare : t.id === "recent" ? counts.recent : 0;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm", tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  <span>{t.label}</span>
                  {c > 0 ? <span className="rounded-full bg-black/10 px-2 text-[11px]">{c}</span> : null}
                </button>
              );
            })}
          </nav>
        </aside>
        <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">{TABS.find((t) => t.id === tab)?.label}</h2>
          {tab === "orders" ? (
            <p className="text-muted-foreground text-sm">سفارشی نیست.</p>
          ) : tab === "profile" ? (
            <Link href="/login" className="text-primary text-sm">مدیریت ورود</Link>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">موردی نیست — از صفحه اصلی اکشن تست را بزنید.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.id} className="border-border flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">{p.price.toLocaleString("fa-IR")} تومان</p>
                  </div>
                  {tab === "cart" ? <button type="button" className="text-destructive text-xs" onClick={() => removeFromCart(p.id)}>حذف</button> : null}
                  {tab === "wishlist" ? <button type="button" className="text-destructive text-xs" onClick={() => toggleWishlist(p)}>حذف</button> : null}
                  {tab === "compare" ? <button type="button" className="text-destructive text-xs" onClick={() => toggleCompare(p)}>حذف</button> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
