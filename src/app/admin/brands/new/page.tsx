"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCreateBrandAction } from "@/app/admin/actions/taxonomy";

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await adminCreateBrandAction({
      name,
      slug: slug || undefined,
      description: description || undefined,
      logo_url: logoUrl || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "name_required" ? "نام الزامی است" : "خطا در ذخیره");
      return;
    }
    router.push("/admin/brands");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">افزودن برند</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span>نام *</span>
          <input
            className="border-border bg-background w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>اسلاگ (خالی = خودکار)</span>
          <input
            className="border-border bg-background w-full rounded-xl border px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            dir="ltr"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>آدرس لوگو (اختیاری — فقط ادمین)</span>
          <input
            className="border-border bg-background w-full rounded-xl border px-3 py-2"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            dir="ltr"
            placeholder="https://..."
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>توضیح</span>
          <textarea
            className="border-border bg-background w-full rounded-xl border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {err ? <p className="text-destructive text-sm">{err}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "…" : "ذخیره"}
          </button>
          <Link href="/admin/brands" className="border-border rounded-xl border px-4 py-2 text-sm">
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}
