import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `برچسب مقاله: ${slug}`,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function BlogTagPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">برچسب مقاله: {slug}</h1>
      <p className="text-muted-foreground text-sm">
        مقالات این برچسب — همیشه noindex.
      </p>
    </div>
  );
}
