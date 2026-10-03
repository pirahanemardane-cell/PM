"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCreateBlogTagAction } from "@/app/admin/actions/tags";
import { SeoAnalysisPanel, emptySeoValue, type SeoPanelValue } from "@/components/admin/seo-analysis-panel";

export default function NewBlogTagPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [seo, setSeo] = useState<SeoPanelValue>(() => emptySeoValue({ robotsIndex: false }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await adminCreateBlogTagAction({
      name,
      slug: slug || undefined,
      meta_title: seo.metaTitle || undefined,
      meta_description: seo.metaDescription || undefined,
      focus_keyphrases: seo.focusKeyphrases,
    } as any);
    setBusy(false);
    if (!res.ok) {
      setErr("خطا");
      return;
    }
    router.push("/admin/blog/tags");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-primary">افزودن برچسب مقاله</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span>نام *</span>
          <input className="border-border w-full rounded-xl border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>اسلاگ</span>
          <input className="border-border w-full rounded-xl border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
        </label>
        <SeoAnalysisPanel pageName={name} slug={slug} shortDescription="" body="" forceNoindex value={seo} onChange={setSeo} />
        {err ? <p className="text-destructive text-sm">{err}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm">
            {busy ? "…" : "انتشار"}
          </button>
          <Link href="/admin/blog/tags" className="border rounded-xl px-4 py-2 text-sm">انصراف</Link>
        </div>
      </form>
    </div>
  );
}
