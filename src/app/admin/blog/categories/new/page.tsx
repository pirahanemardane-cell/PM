"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCreateBlogCategoryAction } from "@/app/admin/actions/blog";
import { SeoAnalysisPanel, emptySeoValue, type SeoPanelValue } from "@/components/admin/seo-analysis-panel";

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [seo, setSeo] = useState<SeoPanelValue>(emptySeoValue());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await adminCreateBlogCategoryAction({
      name,
      slug: slug || undefined,
      description: description || undefined,
      meta_title: seo.metaTitle || undefined,
      meta_description: seo.metaDescription || undefined,
      focus_keyphrases: seo.focusKeyphrases,
      robots_index: seo.robotsIndex,
      robots_follow: seo.robotsFollow,
      canonical_url: seo.canonicalUrl || undefined,
    } as any);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "name_required" ? "نام الزامی" : "خطا");
      return;
    }
    router.push("/admin/blog/categories");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-primary">افزودن دسته‌بندی مقاله</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span>نام *</span>
          <input className="border-border w-full rounded-xl border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>اسلاگ</span>
          <input className="border-border w-full rounded-xl border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>توضیح</span>
          <textarea className="border-border w-full rounded-xl border px-3 py-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <SeoAnalysisPanel pageName={name} slug={slug} shortDescription={description} body={description} value={seo} onChange={setSeo} />
        {err ? <p className="text-destructive text-sm">{err}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm">
            {busy ? "…" : "انتشار"}
          </button>
          <Link href="/admin/blog/categories" className="border rounded-xl px-4 py-2 text-sm">انصراف</Link>
        </div>
      </form>
    </div>
  );
}
