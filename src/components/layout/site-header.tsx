"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { SmartSearch } from "@/components/layout/smart-search";
import { CountBadge, useShopCounts } from "@/components/layout/header-badges";
import { useShopStore } from "@/lib/shop-store";
import { ShopActivityDrawer, type ActivityTab } from "@/components/layout/shop-activity-drawer";
import {
  Heart,
  GitCompareArrows,
  ShoppingCart,
  History,
  Menu,
  X,
  Sun,
  Moon,
  UserRound,
  ChevronDown,
  Shirt,
  Sparkles,
  Tag,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { href: "/", label: "خانه", mega: null as null | "categories" | "brands" | "sale" },
  { href: "/products", label: "فروشگاه", mega: null },
  { href: "/products?view=categories", label: "دسته‌بندی‌ها", mega: "categories" as const },
  { href: "/products?view=brands", label: "برندها", mega: "brands" as const },
  { href: "/products?sale=1", label: "فروش ویژه", mega: "sale" as const },
];

const EXTRA_NAV = [
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const CATEGORY_MEGA = [
  { title: "پیراهن رسمی", desc: "اداری و مجلسی", href: "/products?category=formal", icon: Shirt },
  { title: "پیراهن کژوال", desc: "روزمره و راحت", href: "/products?category=casual", icon: Layers },
  { title: "پیراهن جین", desc: "استایل خیابانی", href: "/products?category=denim", icon: Tag },
  { title: "فصلی و خاص", desc: "کالکشن محدود", href: "/products?category=seasonal", icon: Sparkles },
];

const BRAND_MEGA = [
  { title: "برند ۱", href: "/products?brand=1" },
  { title: "برند ۲", href: "/products?brand=2" },
  { title: "برند ۳", href: "/products?brand=3" },
  { title: "برند داخلی", href: "/products?brand=local" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && root.classList.contains("dark"));
    setDark(isDark);
    root.classList.toggle("dark", isDark);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="border-border hover:bg-muted relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background"
      aria-label="تغییر تم"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function HeaderIcons({ onOpenPanel }: { onOpenPanel?: (tab: string) => void }) {
  const counts = useShopCounts();
  const item =
    "border-border hover:bg-muted relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background";
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" className={item} title="علاقه‌مندی‌ها" onClick={() => onOpenPanel?.("wishlist")}>
        <Heart className="h-4 w-4" />
        <CountBadge count={counts.wishlist} />
      </button>
      <button type="button" className={item} title="مقایسه" onClick={() => onOpenPanel?.("compare")}>
        <GitCompareArrows className="h-4 w-4" />
        <CountBadge count={counts.compare} />
      </button>
      <button type="button" className={item} title="بازدیدهای اخیر" onClick={() => onOpenPanel?.("recent")}>
        <History className="h-4 w-4" />
        <CountBadge count={counts.recent} />
      </button>
      <ThemeToggle />
      <button type="button" className={item} title="سبد خرید" onClick={() => onOpenPanel?.("cart")}>
        <ShoppingCart className="h-4 w-4" />
        <CountBadge count={counts.cart} />
      </button>
    </div>
  );
}

function MegaPanel({
  type,
  onNavigate,
}: {
  type: "categories" | "brands" | "sale";
  onNavigate?: () => void;
}) {
  if (type === "categories") {
    return (
      <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_MEGA.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              onClick={onNavigate}
              className="hover:bg-muted/80 flex items-start gap-3 rounded-xl border border-transparent p-3 transition hover:border-border/40"
            >
              <span className="bg-primary/10 text-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="text-muted-foreground text-xs">{c.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    );
  }
  if (type === "brands") {
    return (
      <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4">
        {BRAND_MEGA.map((b) => (
          <Link
            key={b.title}
            href={b.href}
            onClick={onNavigate}
            className="hover:bg-muted/80 rounded-xl border border-border/30 px-3 py-4 text-center text-sm font-medium"
          >
            {b.title}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="py-4">
      <Link
        href="/products?sale=1"
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

export function SiteHeader({ className }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<ActivityTab>("cart");
  const [trackCode, setTrackCode] = useState("");
  const [mega, setMega] = useState<null | "categories" | "brands" | "sale">(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = useShopStore.subscribe((state, prev) => {
      if (!prev) return;
      if (state.cart.length > prev.cart.length) {
        setPanelTab("cart");
        setPanelOpen(true);
        setMenuOpen(false);
      } else if (state.wishlist.length > prev.wishlist.length) {
        setPanelTab("wishlist");
        setPanelOpen(true);
        setMenuOpen(false);
      } else if (state.compare.length > prev.compare.length) {
        setPanelTab("compare");
        setPanelOpen(true);
        setMenuOpen(false);
      } else if (state.recentlyViewed.length > prev.recentlyViewed.length) {
        setPanelTab("recent");
        setPanelOpen(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail as { tab?: ActivityTab } | undefined;
      setPanelTab(detail?.tab || "cart");
      setPanelOpen(true);
      setMenuOpen(false);
    }
    window.addEventListener("pm:open-panel", onOpen as EventListener);
    return () => window.removeEventListener("pm:open-panel", onOpen as EventListener);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || panelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, panelOpen]);

  function openPanel(tab: string) {
    setPanelTab(tab as ActivityTab);
    setPanelOpen(true);
    setMenuOpen(false);
  }

  function openMega(type: "categories" | "brands" | "sale") {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMega(type);
  }

  function closeMegaDelayed() {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMega(null), 150);
  }

  function submitTrack(e: React.FormEvent) {
    e.preventDefault();
    const code = trackCode.trim();
    if (!code) return;
    window.location.href = `/dashboard?track=${encodeURIComponent(code)}`;
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border/60",
          "bg-[#F8F9FA]/80 dark:bg-[#212529]/75",
          "supports-[backdrop-filter]:bg-[#F8F9FA]/65 dark:supports-[backdrop-filter]:bg-[#212529]/55",
          "backdrop-blur-xl backdrop-saturate-150",
          className
        )}
        dir="rtl"
        onMouseLeave={closeMegaDelayed}
      >
        {/* دسکتاپ */}
        <div className="mx-auto hidden h-16 max-w-7xl items-center gap-3 px-4 lg:flex">
          <div className="shrink-0">
            <Logo size="lg" />
          </div>

          <nav className="relative flex shrink-0 items-center gap-0.5">
            {MAIN_NAV.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => (item.mega ? openMega(item.mega) : setMega(null))}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm",
                    mega && item.mega === mega && "bg-muted text-foreground"
                  )}
                  onClick={(e) => {
                    if (item.mega) {
                      e.preventDefault();
                      setMega((m) => (m === item.mega ? null : item.mega));
                    }
                  }}
                >
                  {item.label}
                  {item.mega ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : null}
                </Link>
              </div>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            <SmartSearch />
          </div>

          <HeaderIcons onOpenPanel={openPanel} />

          <Link
            href="/ورود"
            className="border-border hover:bg-muted inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm"
          >
            <UserRound className="h-4 w-4" />
            ورود
          </Link>
        </div>

        {/* مگامنو تمام‌عرض */}
        {mega ? (
          <div
            className="absolute inset-x-0 top-full z-50 hidden w-full border-b border-border/20 bg-[#F8F9FA]/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:bg-[#212529]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] lg:block"
            onMouseEnter={() => mega && openMega(mega)}
            onMouseLeave={closeMegaDelayed}
          >
            <div className="w-full px-6 py-2 lg:px-10">
              <MegaPanel type={mega} onNavigate={() => setMega(null)} />
            </div>
          </div>
        ) : null}

        {/* موبایل + تبلت: برگر | سرچ | ورود */}
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 lg:hidden">
          <button
            type="button"
            className="border-border bg-background/80 hover:bg-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            aria-label="باز کردن منو"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-10 min-w-0 flex-1">
            <SmartSearch />
          </div>

          <Link
            href="/ورود"
            className="border-border bg-background/80 hover:bg-muted inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm"
          >
            <UserRound className="h-4 w-4 shrink-0" />
            ورود
          </Link>
        </div>
      </header>

      {/* کشوی منوی موبایل — پس‌زمینه شیشه‌ای */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[110] lg:hidden" dir="rtl" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-[#F8F9FA]/45 backdrop-blur-md dark:bg-[#212529]/50"
            aria-label="بستن منو"
            onClick={() => setMenuOpen(false)}
          />
          <div className="border-border/40 absolute top-0 right-0 flex h-full w-[min(100vw,22rem)] flex-col border-l bg-[#F8F9FA]/90 shadow-2xl backdrop-blur-xl dark:bg-[#212529]/90">
            <div className="border-border/40 flex items-center justify-between gap-2 border-b px-4 py-3">
              <Logo size="md" />
              <button
                type="button"
                className="hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-full"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <div>
                <p className="text-muted-foreground mb-2 text-center text-xs">دسترسی سریع</p>
                <HeaderIcons onOpenPanel={openPanel} />
              </div>

              <Link
                href="/ورود"
                onClick={() => setMenuOpen(false)}
                className="bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium"
              >
                <UserRound className="h-4 w-4" />
                ورود
              </Link>

              <nav className="space-y-1">
                {MAIN_NAV.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="hover:bg-muted block rounded-xl px-3 py-2.5 text-sm font-medium"
                    >
                      {item.label}
                    </Link>
                    {item.mega === "categories" ? (
                      <div className="mt-1 mb-2 grid grid-cols-2 gap-2 pr-2">
                        {CATEGORY_MEGA.map((c) => (
                          <Link
                            key={c.title}
                            href={c.href}
                            onClick={() => setMenuOpen(false)}
                            className="bg-muted/60 rounded-lg px-2 py-2 text-center text-xs"
                          >
                            {c.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {item.mega === "brands" ? (
                      <div className="mt-1 mb-2 grid grid-cols-2 gap-2 pr-2">
                        {BRAND_MEGA.map((b) => (
                          <Link
                            key={b.title}
                            href={b.href}
                            onClick={() => setMenuOpen(false)}
                            className="bg-muted/60 rounded-lg px-2 py-2 text-center text-xs"
                          >
                            {b.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>

              <form onSubmit={submitTrack} className="border-border/50 space-y-2 rounded-xl border p-3">
                <label className="block text-sm font-medium">پیگیری سفارش</label>
                <input
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="کد رهگیری"
                  className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm text-right"
                  dir="rtl"
                />
                <button
                  type="submit"
                  className="bg-secondary text-secondary-foreground h-10 w-full rounded-lg text-sm font-medium"
                >
                  پیگیری
                </button>
              </form>

              <nav className="border-border/40 space-y-1 border-t pt-3">
                {EXTRA_NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="hover:bg-muted block rounded-xl px-3 py-2.5 text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      ) : null}

      <ShopActivityDrawer
        open={panelOpen}
        tab={panelTab}
        onOpenChange={setPanelOpen}
        onTabChange={setPanelTab}
      />
    </>
  );
}

export default SiteHeader;
