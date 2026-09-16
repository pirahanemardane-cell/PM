import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground text-sm leading-7">
            فروشگاه تخصصی پیراهن مردانه — رسمی، اسپرت، کروات و اکسسوری.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">دسترسی سریع</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-foreground">
                همه محصولات
              </Link>
            </li>
            <li>
              <Link href="/products?featured=true" className="hover:text-foreground">
                محصولات ویژه
              </Link>
            </li>
            <li>
              <Link href="/size-guide" className="hover:text-foreground">
                راهنمای سایز
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">پشتیبانی</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <Link href="/shipping" className="hover:text-foreground">
                ارسال و تحویل
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-foreground">
                مرجوعی و تعویض
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                سوالات متداول
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs">
          <span>© {year} پیراهن مردانه</span>
          <span>تمامی حقوق محفوظ است</span>
        </div>
      </div>
    </footer>
  );
}
