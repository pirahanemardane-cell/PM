"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  RotateCcw,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Bell,
  X,
  Ticket,
  Tag,
  GitCompare,
  History,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type CustomerNavItem = {
  id: string;
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: number | string;
};

const NAV_MAIN: CustomerNavItem[] = [
  { id: "shop", title: "فروشگاه", icon: LayoutDashboard },
  { id: "cart", title: "سبد خرید", icon: ShoppingCart },
  { id: "orders", title: "سفارش‌ها", icon: Package },
  { id: "track", title: "پیگیری", icon: Search },
  { id: "wishlist", title: "علاقه‌مندی‌ها", icon: Heart },
  { id: "compare", title: "مقایسه", icon: GitCompare },
  { id: "recent", title: "بازدید اخیر", icon: History },
  { id: "addresses", title: "آدرس‌ها", icon: MapPin },
  { id: "coupons", title: "کد تخفیف", icon: Tag },
  { id: "tickets", title: "پشتیبانی", icon: Ticket },
  { id: "returns", title: "بازگشت کالا", icon: RotateCcw },
  { id: "notifications", title: "اعلان‌ها", icon: Bell },
];

const NAV_BOTTOM: CustomerNavItem[] = [
  { id: "profile", title: "پروفایل", href: "/dashboard?tab=profile", icon: User },
  { id: "logout", title: "خروج", icon: LogOut },
];

function NavRow({
  item,
  active,
  onClick,
}: {
  item: CustomerNavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-[6px] px-2.5 py-[7px] transition-all duration-200 select-none",
        active
          ? "bg-black/5 font-medium text-foreground dark:bg-white/10"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5",
      )}
    >
      <div className="flex items-center gap-2.5">
        <item.icon
          className={cn(
            "h-4 w-4 transition-colors",
            active
              ? "text-foreground"
              : "text-muted-foreground/70 group-hover:text-foreground/70",
          )}
          strokeWidth={1.5}
        />
        <span className="truncate text-[13px] tracking-wide">{item.title}</span>
      </div>
      {item.badge != null ? (
        <span className="bg-primary/10 text-primary flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

export function CustomerSidebarNav({
  className = "",
  displayName = "حساب من",
  activeTab,
  onNavigate,
}: {
  className?: string;
  displayName?: string;
  activeTab: string;
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();

  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className={cn(
        "border-border/50 bg-card/50 flex h-full w-[260px] flex-col border-l p-3 font-sans",
        className,
      )}
      dir="rtl"
    >
      {/* هدر کاربر — همان استایل WorkspaceSwitcher */}
      <div className="mb-4 flex items-center justify-between rounded-lg px-2 py-2 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-[6px] text-[13px] font-semibold shadow-sm">
            {(displayName || "ک").charAt(0)}
          </div>
          <div className="flex max-w-[140px] flex-col overflow-hidden">
            <span className="text-foreground mb-1 truncate text-[13px] leading-none font-medium">
              {displayName}
            </span>
            <span className="text-muted-foreground text-[11px] leading-none">
              پنل مشتری
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_MAIN.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>

      <div className="border-border/50 mt-auto flex flex-col gap-0.5 border-t pt-4">
        {NAV_BOTTOM.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => {
              if (item.id === "logout") void logout();
              else onNavigate(item.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** شل کامل پنل — ظاهر همان Preview کامپوننت */
export function CustomerDashboardShell({
  displayName,
  activeTab,
  onTabChange,
  title,
  children,
}: {
  displayName?: string;
  activeTab: string;
  onTabChange: (id: string) => void;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="bg-background flex min-h-[100dvh] w-full flex-col p-3 md:p-6"
      dir="rtl"
    >
      <div className="border-border/50 bg-card relative mx-auto flex h-[min(900px,calc(100dvh-1.5rem))] w-full max-w-6xl overflow-hidden rounded-xl border shadow-sm ring-1 ring-black/5 dark:ring-white/5">
        {/* سایدبار */}
        <div
          className={cn(
            "border-border/50 bg-card/50 h-full shrink-0 overflow-hidden border-l transition-all duration-300 ease-in-out",
            open ? "w-[260px] opacity-100" : "w-0 border-none opacity-0",
          )}
        >
          <CustomerSidebarNav
            className="w-[260px] border-none bg-transparent"
            displayName={displayName}
            activeTab={activeTab}
            onNavigate={onTabChange}
          />
        </div>

        {/* محتوا */}
        <div className="flex min-w-0 flex-1 flex-col bg-black/[0.02] transition-all duration-300 dark:bg-white/[0.02]">
          <div className="border-border/50 bg-card flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-md p-1.5 transition-colors dark:hover:bg-white/5"
                aria-label="منو"
              >
                {open ? (
                  <PanelRightClose className="h-[18px] w-[18px]" strokeWidth={1.5} />
                ) : (
                  <PanelRightOpen className="h-[18px] w-[18px]" strokeWidth={1.5} />
                )}
              </button>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span className="truncate">حساب من</span>
                <span>/</span>
                <span className="text-foreground truncate font-medium">{title}</span>
              </div>
            </div>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              بازگشت به فروشگاه
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
