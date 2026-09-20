"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Award,
  Tags,
  FileText,
  PlusCircle,
  List,
} from "lucide-react";

type NavLeaf = { href: string; label: string; icon?: React.ElementType };
type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  children: NavLeaf[];
};

const TOP: NavLeaf[] = [
  { href: "/admin/dashboard", label: "داشبورد", icon: Home },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
];

const GROUPS: NavGroup[] = [
  {
    id: "products",
    label: "محصولات",
    icon: Package,
    children: [
      { href: "/admin/products", label: "مشاهده همه محصولات", icon: List },
      { href: "/admin/products/new", label: "افزودن محصول", icon: PlusCircle },
      { href: "/admin/categories", label: "مشاهده دسته‌بندی‌ها", icon: FolderTree },
      { href: "/admin/categories/new", label: "افزودن دسته‌بندی", icon: PlusCircle },
      { href: "/admin/brands", label: "مشاهده برندها", icon: Award },
      { href: "/admin/brands/new", label: "افزودن برند", icon: PlusCircle },
      { href: "/admin/tags", label: "مشاهده برچسب‌ها", icon: Tags },
      { href: "/admin/tags/new", label: "افزودن برچسب", icon: PlusCircle },
    ],
  },
  {
    id: "blog",
    label: "بلاگ",
    icon: FileText,
    children: [
      { href: "/admin/blog", label: "مشاهده همه مقالات", icon: List },
      { href: "/admin/blog/new", label: "افزودن مقاله", icon: PlusCircle },
      {
        href: "/admin/blog/categories",
        label: "دسته‌بندی مقالات",
        icon: FolderTree,
      },
      {
        href: "/admin/blog/categories/new",
        label: "افزودن دسته‌بندی مقاله",
        icon: PlusCircle,
      },
      { href: "/admin/blog/tags", label: "برچسب مقالات", icon: Tags },
      { href: "/admin/blog/tags/new", label: "افزودن برچسب مقاله", icon: PlusCircle },
    ],
  },
];

const BOTTOM: NavLeaf[] = [
  { href: "/admin/reviews", label: "نظرات", icon: MessageSquare },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: Tag },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/analytics", label: "گزارش‌ها", icon: BarChart3 },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  if (href === "/admin/products")
    return pathname === "/admin/products" || pathname === "/admin/products/";
  if (href === "/admin/blog")
    return pathname === "/admin/blog" || pathname === "/admin/blog/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    products: true,
    blog: pathname.startsWith("/admin/blog"),
  });

  function toggleGroup(id: string) {
    setOpenGroups((s) => ({ ...s, [id]: !s[id] }));
  }

  function LeafLink({ item }: { item: NavLeaf }) {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
          active
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-foreground"
        }`}
      >
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" /> : null}
        {open ? <span className="leading-snug">{item.label}</span> : null}
      </Link>
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen" dir="rtl">
      <aside
        className={`border-border sticky top-0 flex h-screen shrink-0 flex-col border-l transition-all ${
          open ? "w-64" : "w-14"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3">
          {open ? (
            <span className="text-sm font-bold">پنل ادمین</span>
          ) : (
            <span className="sr-only">پنل ادمین</span>
          )}
          <button
            type="button"
            className="border-border inline-flex h-8 w-8 items-center justify-center rounded-md border"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "جمع کردن منو" : "باز کردن منو"}
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {TOP.map((item) => {
            const Icon = item.icon!;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {open ? <span>{item.label}</span> : null}
              </Link>
            );
          })}

          {GROUPS.map((g) => {
            const Icon = g.icon;
            const expanded = openGroups[g.id] ?? false;
            const groupActive = g.children.some((c) =>
              isActive(pathname, c.href),
            );
            return (
              <div key={g.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!open) setOpen(true);
                    toggleGroup(g.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    groupActive && !expanded
                      ? "bg-muted font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {open ? (
                    <>
                      <span className="flex-1 text-right">{g.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  ) : null}
                </button>
                {open && expanded ? (
                  <div className="border-border/60 mr-3 mt-1 space-y-0.5 border-r pr-2">
                    {g.children.map((c) => (
                      <LeafLink key={c.href} item={c} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="border-border my-2 border-t pt-2">
            {BOTTOM.map((item) => {
              const Icon = item.icon!;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {open ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t p-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground block rounded-lg px-3 py-2 text-xs"
          >
            {open ? "بازگشت به فروشگاه" : "←"}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
