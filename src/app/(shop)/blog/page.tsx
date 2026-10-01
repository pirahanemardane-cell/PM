import Link from "next/link";
import type { Metadata } from "next";
import { listPublishedPostsAction } from "@/app/(shop)/actions/blog-public";
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/dates/jalali";


export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "بلاگ",
  description: "مقالات فروشگاه پیراهن مردانه",
};

export default async function BlogIndexPage() {
  const res = await listPublishedPostsAction();
  const items = res.items as {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_url: string | null;
    published_at: string | null;
    category?: { name: string } | null;
  }[];

  return (
    <main className="w-full max-w-none mx-auto space-y-8 px-4 py-8 md:py-12" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-iranyekan-heavy text-primary">
          بلاگ
        </h1>
      </div>

      {!items.length ? (
        <p className="text-muted-foreground text-sm"></p>
      ) : (
        <ul className="space-y-6">
          {items.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="border-border hover:border-primary/40 block overflow-hidden rounded-2xl border transition"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {post.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.cover_url}
                      alt=""
                      className="h-40 w-full object-cover sm:h-auto sm:w-48"
                    />
                  ) : null}
                  <div className="flex-1 space-y-2 p-4">
                    {post.category?.name ? (
                      <span className="text-muted-foreground text-xs">
                        {post.category.name}
                      </span>
                    ) : null}
                    <h2 className="text-lg font-semibold text-primary">{post.title}</h2>
                    {post.excerpt ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {post.excerpt}
                      </p>
                    ) : null}
                    {post.published_at ? (
                      <time className="text-muted-foreground text-xs">
                        {formatJalaliDate(post.published_at)}
                      </time>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
