"use client";
import { NotificationCountBadge } from "@/components/notifications/notification-count-badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
 import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HeaderAuthButton } from "@/components/layout/header-auth-button";
import { Logo } from "@/components/brand/logo";
import { SmartSearch } from "@/components/layout/smart-search";
import { CountBadge, useShopCounts } from "@/components/layout/header-badges";
import { useShopStore } from "@/lib/shop-store";
import { ShopActivityDrawer, type ActivityTab } from "@/components/layout/shop-activity-drawer";
import { Heart, GitCompareArrows, ShoppingCart, History, Menu, X, Sun, Moon, UserRound, ChevronDown, Shirt, Sparkles, Tag, Layers, Bell} from "lucide-react";
import { cn } from "@/lib/utils"; const MAIN_NAV = [
  { href: "/", label: "خانه", mega: null as null | "categories" | "brands" | "sale" },
  { href: "/products", label: "فروشگاه", mega: null },
  { href: "/blog", label: "بلاگ", mega: null },
  { href: "/products", label: "دسته‌بندی‌ها", mega: "categories" as const },
  { href: "/brands", label: "برندها", mega: "brands" as const },
  { href: "/products?featured=1", label: "شگفت‌انگیز", mega: null },
]; const EXTRA_NAV = [ { href: "/blog", label: "بلاگ" }, { href: "/about", label: "درباره ما" }, { href: "/contact", label: "تماس با ما" },
]; const CATEGORY_MEGA = [ { title: "پیراهن رسمی", desc: "اداری و مجلسی", href: "/products", icon: Shirt }, { title: "پیراهن کژوال", desc: "روزمره و راحت", href: "/products", icon: Layers }, { title: "پیراهن جین", desc: "استایل خیابانی", href: "/products", icon: Tag }, { title: "همه محصولات", desc: "مشاهده فروشگاه", href: "/products", icon: Sparkles },
]; const BRAND_MEGA = [ { title: "همه برندها", href: "/brands" }, { title: "فروشگاه", href: "/products" },
]; function ThemeToggle() { const [dark, setDark] = useState(false); useEffect(() => { const root = document.documentElement; const stored = localStorage.getItem("theme"); const isDark = stored === "dark" || (!stored && root.classList.contains("dark")); setDark(isDark); root.classList.toggle("dark", isDark); }, []); function toggle() { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("theme", next ? "dark" : "light"); } return ( <button type="button" onClick={toggle} className="border-border hover:bg-primary hover:text-primary-foreground relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background" aria-label="تغییر تم" > {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} </button> );
} function HeaderIcons({ onOpenPanel }: { onOpenPanel?: (tab: string) => void }) { const counts = useShopCounts(); const item = "border-border hover:bg-primary hover:text-primary-foreground relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background"; return ( <div className="flex flex-wrap items-center justify-center gap-1.5"> <button type="button" className={item} title="علاقه‌مندی‌ها" onClick={() => onOpenPanel?.("wishlist")}> <Heart className="h-4 w-4" /> <CountBadge count={counts.wishlist} /> </button> <button type="button" className={item} title="مقایسه" onClick={() => onOpenPanel?.("compare")}> <GitCompareArrows className="h-4 w-4" /> <CountBadge count={counts.compare} /> </button> <button type="button" className={item} title="بازدیدهای اخیر" onClick={() => onOpenPanel?.("recent")}> <History className="h-4 w-4" /> <CountBadge count={counts.recent} /> </button> <ThemeToggle /> <button type="button" className={item} title="اعلان‌ها" onClick={() => onOpenPanel?.("notifications")}><Bell className="h-4 w-4" /><NotificationCountBadge /></button> 
<button type="button" className={item} title="سبد خرید" onClick={() => onOpenPanel?.("cart")}> <ShoppingCart className="h-4 w-4" /> <CountBadge count={counts.cart} /> </button> </div> );
} function MegaPanel({
  type,
  onNavigate,
  categories = [],
  brands = [],
}: {
  type: "categories" | "brands" | "sale";
  onNavigate?: () => void;
  categories?: { name: string; href: string }[];
  brands?: { name: string; href: string }[];
}) {
  if (type === "sale") {
    return (
      <div className="py-4">
        <Link
          href="/products?featured=1"
          onClick={onNavigate}
          className="from-primary/15 to-transparent flex flex-col gap-1 rounded-2xl bg-gradient-to-l p-5"
        >
          <span className="text-primary text-xs font-bold">فروش ویژه</span>
          <span className="text-lg font-black">تخفیف‌های امروز</span>
          <span className="text-muted-foreground text-sm">بهترین قیمت روی پیراهن‌های منتخب</span>
        </Link>
      </div>
    );
  }
  const items = type === "categories" ? categories : brands;
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        {type === "categories" ? "هنوز دسته‌بندی‌ای ثبت نشده" : "هنوز برندی ثبت نشده"}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.href + item.name}
          href={item.href}
          onClick={onNavigate}
          className="hover:bg-primary hover:text-primary-foreground rounded-xl border border-[#023047]/40 px-3 py-4 text-center text-sm font-medium dark:border-[#13ABC4]/55"
        >
          {item.name}
        </Link>
      ))}
      <Link
        href={type === "categories" ? "/products" : "/brands"}
        onClick={onNavigate}
        className="hover:bg-primary hover:text-primary-foreground rounded-xl border border-dashed border-[#023047]/30 px-3 py-4 text-center text-sm font-medium dark:border-[#13ABC4]/40"
      >
        {type === "categories" ? "همه محصولات" : "همه برندها"}
      </Link>
    </div>
  );
}

export function SiteHeader({ className }: { className?: string }) {
  const [megaCategories, setMegaCategories] = useState<{ name: string; href: string }[]>([]);
  const [megaBrands, setMegaBrands] = useState<{ name: string; href: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/nav/mega")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMegaCategories(data.categories ?? []);
        setMegaBrands(data.brands ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false); const [panelOpen, setPanelOpen] = useState(false); const [panelTab, setPanelTab] = useState<ActivityTab>("cart"); const [trackCode, setTrackCode] = useState(""); const [mega, setMega] = useState<null | "categories" | "brands" | "sale">(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null); useEffect(() => { const unsub = useShopStore.subscribe((state, prev) => { if (!prev) return; if (state.cart.length > prev.cart.length) { setPanelTab("cart"); setPanelOpen(true); setMenuOpen(false); } else if (state.wishlist.length > prev.wishlist.length) { setPanelTab("wishlist"); setPanelOpen(true); setMenuOpen(false); } else if (state.compare.length > prev.compare.length) { setPanelTab("compare"); setPanelOpen(true); setMenuOpen(false); } }); 
  return () => unsub(); }, []); useEffect(() => { function onOpen(e: Event) { const detail = (e as CustomEvent).detail as { tab?: ActivityTab } | undefined; setPanelTab(detail?.tab || "cart"); setPanelOpen(true); setMenuOpen(false); } window.addEventListener("pm:open-panel", onOpen as EventListener); return () => window.removeEventListener("pm:open-panel", onOpen as EventListener); }, []); useEffect(() => { document.body.style.overflow = menuOpen || panelOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen, panelOpen]); function openPanel(tab: string) { setPanelTab(tab as ActivityTab); setPanelOpen(true); setMenuOpen(false); } function openMega(type: "categories" | "brands" | "sale") { if (megaTimer.current) clearTimeout(megaTimer.current); setMega(type); } function closeMegaDelayed() { if (megaTimer.current) clearTimeout(megaTimer.current); megaTimer.current = setTimeout(() => setMega(null), 150); } function submitTrack(e: React.FormEvent) { e.preventDefault(); const code = trackCode.trim(); if (!code) return; window.location.href = `/dashboard?track=${encodeURIComponent(code)}`; setMenuOpen(false); } return ( <> <header className={cn( "sticky top-0 z-50 border-b border-border/60", "bg-[#F8F9FA]/80 dark:bg-[#212529]/75", "supports-[backdrop-filter]:bg-[#F8F9FA]/65 dark:supports-[backdrop-filter]:bg-[#212529]/55", "backdrop-blur-xl backdrop-saturate-150", className )} dir="rtl" onMouseLeave={closeMegaDelayed} > {/* دسکتاپ */} <div className="mx-auto hidden h-16 max-w-none items-center gap-3 px-4 xl:flex"> <div className="shrink-0"> <Logo size="lg" /> </div> <nav className="relative flex shrink-0 items-center gap-0.5"> {MAIN_NAV.map((item) => ( <div key={item.label} className="relative" onMouseEnter={() => (item.mega ? openMega(item.mega) : setMega(null))} > <Link href={item.href} className={cn( "text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm", mega && item.mega === mega && "bg-muted text-foreground" )} onClick={(e) => { if (item.mega) { e.preventDefault(); setMega((m) => (m === item.mega ? null : item.mega)); } }} > {item.label} {item.mega ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : null} </Link> </div> ))} </nav> <div className="min-w-0 flex-1 h-10"> <SmartSearch /> </div> <HeaderIcons onOpenPanel={openPanel} /> <HeaderAuthButton /> </div> {/* مگامنو تمام‌عرض */} {mega ? ( <div className="absolute inset-x-0 top-full z-50 hidden w-full border-b border-secondary/40 bg-[#e9ecef] dark:bg-[#343a40] shadow-md xl:block" onMouseEnter={() => mega && openMega(mega)} onMouseLeave={closeMegaDelayed} > <div className="w-full px-6 py-2 lg:px-10"> <MegaPanel type={mega} onNavigate={() => setMega(null)} categories={megaCategories} brands={megaBrands} /> </div> </div> ) : null} {/* موبایل + تبلت: برگر | سرچ | ورود */} <div className="mx-auto flex h-14 max-w-none items-center gap-2 px-3 xl:hidden"> <button type="button" className="border-border bg-background/80 hover:bg-primary hover:text-primary-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" aria-label="باز کردن منو" onClick={() => setMenuOpen(true)} > <Menu className="h-5 w-5" /> </button> <div className="h-10 min-w-0 flex-1"> <SmartSearch /> </div> <HeaderAuthButton /> </div> </header> {/* کشوی منوی موبایل — پس‌زمینه شیشه‌ای */} {menuOpen ? ( <div className="fixed inset-0 z-[110] xl:hidden" dir="rtl" role="dialog" aria-modal="true"> <button type="button" className="absolute inset-0 bg-[#F8F9FA]/45 backdrop-blur-md dark:bg-[#212529]/50" aria-label="بستن منو" onClick={() => setMenuOpen(false)} /> <div className="border-border/40 absolute top-0 right-0 flex h-full w-[min(100vw,22rem)] flex-col border-l bg-[#F8F9FA]/90 shadow-2xl backdrop-blur-xl dark:bg-[#212529]/90"> <div className="border-border/40 flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3"> <Logo size="sm" /> <button type="button" className=" hover:bg-primary hover:text-primary-foreground inline-flex h-10 w-10 items-center justify-center rounded-full" onClick={() => setMenuOpen(false)} > <X className="h-5 w-5" /> </button> </div> <div className="flex-1 space-y-5 overflow-y-auto p-4"> <div>  <HeaderIcons onOpenPanel={openPanel} /> </div> <HeaderAuthButton fullWidth onNavigate={() => setMenuOpen(false)} /> <nav className="space-y-1"> {MAIN_NAV.map((item) => ( <div key={item.label}> <Link href={item.href} onClick={() => setMenuOpen(false)} className=" hover:bg-primary hover:text-primary-foreground block rounded-xl px-3 py-2.5 text-sm font-medium" > {item.label} </Link> {null} {null} </div> ))} </nav> <form onSubmit={submitTrack} className="border-border/50 space-y-2 rounded-xl border p-3"> <label className="block text-sm font-medium">پیگیری سفارش</label> <input value={trackCode} onChange={(e) => setTrackCode(e.target.value)} placeholder="کد رهگیری" className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm text-right" dir="rtl" /> <button type="submit" className="bg-primary text-primary-foreground h-10 w-full rounded-lg text-sm font-medium hover:bg-primary/90" > پیگیری </button> </form> <nav className="border-border/40 space-y-1 border-t pt-3"> {EXTRA_NAV.map((item) => ( <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className=" hover:bg-primary hover:text-primary-foreground block rounded-xl px-3 py-2.5 text-sm" > {item.label} </Link> ))} </nav> </div> </div> </div> ) : null} <ShopActivityDrawer open={panelOpen} tab={panelTab} onOpenChange={setPanelOpen} onTabChange={setPanelTab} /> </> );
} 