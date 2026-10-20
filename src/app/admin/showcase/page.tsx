import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LoadingBlock,
  EmptyBlock,
  ErrorBlock,
} from "@/components/ui/ui-state-blocks";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "UI Showcase | Admin",
  robots: { index: false, follow: false },
};

export default function AdminShowcasePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 md:p-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Showcase سیستم طراحی</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            فقط ادمین — مرجع بصری توکن‌ها و stateهای استاندارد.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">تم</h2>
        <p className="text-muted-foreground text-xs">
          روشن/تاریک با next-themes — کلید pm-theme در localStorage.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">رنگ و دکمه</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>پیش‌فرض</Badge>
          <Badge variant="secondary">ثانویه</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="destructive">خطا</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">فرم</h2>
        <Input placeholder="نمونه ورودی" className="max-w-sm" />
        <Input placeholder="غیرفعال" disabled className="max-w-sm" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stateها</h2>
        <LoadingBlock className="border-border rounded-xl border" />
        <EmptyBlock
          title="لیست خالی"
          description="هنوز موردی ثبت نشده است."
        />
        <ErrorBlock title="خطای نمونه" description="این فقط نمایش است." />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">تایپوگرافی</h2>
        <h1 className="h1 text-xl">عنوان H1</h1>
        <h2 className="h2 text-lg">عنوان H2</h2>
        <h3 className="h3 text-base">عنوان H3</h3>
        <p className="text-sm">متن بدنه معمولی فروشگاه.</p>
        <p className="price text-primary text-base">۱٬۲۵۰٬۰۰۰ تومان</p>
      </section>
    </div>
  );
}
