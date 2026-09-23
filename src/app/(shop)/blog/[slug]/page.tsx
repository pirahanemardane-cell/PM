import { RelatedStrip } from "@/components/shop/related-strip";
import { getRelatedProducts } from "@/lib/related-products";
import { getRelatedPosts } from "@/lib/related-posts";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPostBySlugAction } from "@/app/(shop)/actions/blog-public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPublishedPostBySlugAction(slug);
  if (!res.ok || !res.post) return { title: "مقاله" };
  const p = res.post as { title: string; excerpt: string | null };
  return {
    title: p.title,
    description: p.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const res = await getPublishedPostBySlugAction(slug);
  if (!res.ok || !res.post) notFound();

  const post = res.post as {
    title: string;
    body: string | null;
    excerpt: string | null;
    cover_url: string | null;
    published_at: string | null;
    category?: { name: string } | null;
  };

  return (
    <article className="w-full max-w-none space-y-6 p-6" dir="rtl">
      <Link href="/blog" className="text-primary text-sm underline">
        ← بازگشت به بلاگ
      </Link>
      {post.category?.name ? (
        <p className="text-muted-foreground text-xs">{post.category.name}</p>
      ) : null}
      <h1 className="text-3xl font-bold leading-snug">{post.title}</h1>
      {post.published_at ? (
        <time className="text-muted-foreground text-sm">
          {new Date(post.published_at).toLocaleDateString("fa-IR")}
        </time>
      ) : null}
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt=""
          className="border-border w-full rounded-2xl border object-cover"
        />
      ) : null}
      {post.excerpt ? (
        <p className="text-muted-foreground text-base">{post.excerpt}</p>
      ) : null}
      <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-base leading-8">
        {post.body || ""}
      </div>
    </article>
  );
}
