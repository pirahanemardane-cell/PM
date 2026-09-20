"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCreateProductTagAction } from "@/app/admin/actions/tags";

export default function NewProductTagPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await adminCreateProductTagAction({ name, slug: slug || undefined });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "name_required" ? "نام الزامی" : "خطا");
      return;
    }
    router.push("/admin/tags");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">افزودن برچسب محصول</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span>نام *</span>
          <input
            className="border-border w-full rounded-xl border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>اسلاگ</span>
          <input
            className="border-border w-full rounded-xl border px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            dir="ltr"
          />
        </label>
        {err ? <p className="text-destructive text-sm">{err}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
          >
            ذخیره
          </button>
          <Link href="/admin/tags" className="border rounded-xl px-4 py-2 text-sm">
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}
