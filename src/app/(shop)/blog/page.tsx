import Link from "next/link";
import type { Metadata } from "next";
import { listPublishedPostsAction } from "@/app/(shop)/actions/blog-public";

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
    <div className="w-full max-w-none space-y-8 p-6" dir="rtl">
      <header>
        <h1 className="text-3xl font-bold text-primary">بلاگ</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          
        </p>
      </header>

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
                        {new Date(post.published_at).toLocaleDateString("fa-IR")}
                      </time>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
