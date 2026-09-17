"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Shirt,
  Gem,
  CircleDot,
  Link2,
  Sparkles,
  Star,
  Tag,
  HelpCircle,
  FileText,
  Shield,
  RotateCcw,
  type LucideIcon,
  Heart,
  ShoppingBag,
  History,
  ArrowLeftRight} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

const productLinks: LinkItem[] = [
  {
    title: "پیراهن مردانه",
    href: "/products?category=shirts",
    description: "رسمی، کژوال، لینن، آکسفورد و …",
    icon: Shirt,
  },
  {
    title: "کروات",
    href: "/products?category=ties",
    description: "ابریشم، طرح‌دار، باریک و پهن",
    icon: Link2,
  },
  {
    title: "پاپیون",
    href: "/products?category=bow-ties",
    description: "قابل تنظیم و پیش‌گره",
    icon: CircleDot,
  },
  {
    title: "دکمه سردست",
    href: "/products?category=cufflinks",
    description: "فلزی، سنگی، میناکاری",
    icon: Gem,
  },
  {
    title: "اکسسوری",
    href: "/products?category=accessories",
    description: "گیره کروات، دستمال جیب و …",
    icon: Sparkles,
  },
  {
    title: "محصولات ویژه",
    href: "/products?featured=true",
    description: "منتخب و پیشنهاد فروشگاه",
    icon: Star,
  },
];

const supportLinks: LinkItem[] = [
  {
    title: "راهنمای سایز",
    href: "/size-guide",
    description: "جدول اندازه‌گیری پیراهن",
    icon: FileText,
  },
  {
    title: "ارسال و تحویل",
    href: "/shipping",
    description: "روش‌ها و زمان ارسال",
    icon: Tag,
  },
  {
    title: "مرجوعی و تعویض",
    href: "/returns",
    description: "سیاست بازگشت کالا",
    icon: RotateCcw,
  },
];

const legalLinks: LinkItem[] = [
  { title: "حریم خصوصی", href: "/privacy", icon: Shield },
  { title: "شرایط استفاده", href: "/terms", icon: FileText },
  { title: "سوالات متداول", href: "/faq", icon: HelpCircle },
];

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-b border-transparent", {
        "bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg":
          scrolled,
      })}
    >
      <nav className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <Logo priority />

          <NavigationMenu className="hidden md:flex" dir="rtl">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  محصولات
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1">
                  <ul className="bg-popover grid w-[min(100vw-2rem,36rem)] grid-cols-2 gap-2 rounded-md border p-2 shadow">
                    {productLinks.map((item) => (
                      <li key={item.href}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                  <div className="p-2">
                    <p className="text-muted-foreground text-sm">
                      همه کالاها را ببینید:{" "}
                      <Link
                        href="/محصولات"
                        className="text-foreground font-medium hover:underline"
                      >
                        فروشگاه
                      </Link>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  خدمات
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pb-1.5">
                  <div className="grid w-[min(100vw-2rem,36rem)] grid-cols-2 gap-2">
                    <ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
                      {supportLinks.map((item) => (
                        <li key={item.href}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-1 p-2">
                      {legalLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                              href={item.href}
                              className="hover:bg-accent flex flex-row items-center gap-x-2 rounded-md p-2"
                            >
                              <item.icon className="text-foreground size-4" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/محصولات"
                  className="hover:bg-accent rounded-md px-4 py-2 text-sm font-medium"
                >
                  همه محصولات
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1">
            <ThemeToggle />

          <div className="flex items-center gap-1">
            <Link
              href="/آخرین-مشاهده-ها"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="آخرین مشاهده‌ها"
            >
              <History className="h-5 w-5" />
            </Link>
            <Link
              href="/سبد-خرید"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <Link
              href="/مقایسه"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="مقایسه"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Link>
            <Link
              href="/علاقه-مندی-ها"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="علاقه‌مندی‌ها"
            >
              <Heart className="h-5 w-5" />
            </Link>
          </div>

          </div>
          <Link href="/ورود" className={buttonVariants({ variant: "outline" })}>
            ورود
          </Link>
          <Link href="/محصولات" className={buttonVariants()}>
            خرید
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="منو"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>

      <MobileMenu open={open} className="flex flex-col justify-between gap-4 overflow-y-auto">
        <div className="flex w-full flex-col gap-y-3">
          <span className="text-muted-foreground text-sm">محصولات</span>
          {productLinks.map((link) => (
            <ListItem key={link.title} {...link} onClick={() => setOpen(false)} />
          ))}
          <span className="text-muted-foreground mt-2 text-sm">خدمات</span>
          {[...supportLinks, ...legalLinks].map((link) => (
            <ListItem key={link.title} {...link} onClick={() => setOpen(false)} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/ورود"
            onClick={() => setOpen(false)}
            className={buttonVariants({ variant: "outline", className: "w-full bg-transparent" })}
          >
            ورود
          </Link>
          <Link
            href="/محصولات"
            onClick={() => setOpen(false)}
            className={buttonVariants({ className: "w-full" })}
          >
            خرید
          </Link>
        </div>
      </MobileMenu>
    
          </header>
  );
}

function MobileMenu({
  open,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & { open: boolean }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg",
        "fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col overflow-hidden border-y md:hidden"
      )}
    >
      <div className={cn("size-full p-4", className)} {...props}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & LinkItem) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex w-full flex-row gap-x-2 rounded-sm p-2",
        className
      )}
      {...props}
    >
      <div className="bg-background/40 flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm">
        <Icon className="text-foreground size-5" />
      </div>
      <div className="flex flex-col items-start justify-center text-start">
        <span className="font-medium">{title}</span>
        {description ? (
          <span className="text-muted-foreground text-xs">{description}</span>
        ) : null}
      </div>
    </Link>
  );
}

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);
  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return scrolled;
}
