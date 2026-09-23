import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

/** برچسب محصول: برای کاربر قابل‌مشاهده، برای موتور جستجو هیچ‌وقت ایندکس نشود */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `برچسب: ${slug}`,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function ProductTagPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="w-full max-w-none space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">برچسب: {slug}</h1>
      <p className="text-muted-foreground text-sm">
        لیست محصولات این برچسب به‌زودی — این صفحه برای موتورهای جستجو noindex است.
      </p>
    </div>
  );
}
