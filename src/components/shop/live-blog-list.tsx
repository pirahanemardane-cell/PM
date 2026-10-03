"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { listPublishedPostsAction } from "@/app/(shop)/actions/blog-public";
import { formatJalaliDate } from "@/lib/dates/jalali";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
  category?: { name: string } | null;
};

export function LiveBlogList({ initialItems }: { initialItems: Post[] }) {
  const [items, setItems] = useState<Post[]>(initialItems);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const reload = useCallback(() => {
    startTransition(async () => {
      const res = await listPublishedPostsAction();
      if (res.items) setItems(res.items as Post[]);
    });
  }, []);

  useRtEvent(RT.blog, () => {
    reload();
  });

  if (!items.length) {
    return <p className="text-muted-foreground text-sm">هنوز مقاله‌ای منتشر نشده است.</p>;
  }

  return (
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
  );
}
