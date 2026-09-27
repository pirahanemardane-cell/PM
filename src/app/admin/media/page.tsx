"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchiveMediaAction,
  adminHardDeleteMediaAction,
} from "@/app/admin/actions/lifecycle";
  adminDeleteProductImageAction,
  adminListProductImagesAction,
  adminUploadProductImageAction,
  type MediaListItem,
} from "@/app/admin/actions/media";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);

  
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchiveMediaAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteMediaAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        has_orders: "در سفارش‌ها استفاده شده",
        has_products: "به محصول متصل است",
      };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }
  async function archiveOne(id: string, name: string) {
    if (!confirm(`آرشیو «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminArchiveMediaAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteMediaAction([id]);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        has_orders: "در سفارش‌ها استفاده شده",
      };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    void load();
  }
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListProductImagesAction(80);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "بارگذاری فهرست ناموفق بود",
      );
      return;
    }
    setItems(res.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await adminUploadProductImageAction(fd);
    setUploading(false);
    if (!res.ok) {
      setError(
        res.error === "too_large"
          ? "حداکثر ۱۲ مگابایت"
          : res.error === "not_image"
            ? "فقط تصویر"
            : "آپلود ناموفق",
      );
      return;
    }
    setLastUploadUrl(res.url);
    setMsg("آپلود شد — برای اتصال به محصول از صفحه ویرایش محصول استفاده کنید.");
    await load();
  }

  async function onDelete(item: MediaListItem) {
    if (!confirm("این تصویر از R2 و پایگاه حذف شود؟")) return;
    setMsg(null);
    const res = await adminDeleteProductImageAction({
      url: item.url,
      imageId: item.id,
    });
    if (!res.ok) {
      setError("حذف ناموفق");
      return;
    }
    setMsg("حذف شد");
    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">رسانه</h1>
        <p className="text-muted-foreground text-sm">
          تصاویر محصولات روی Cloudflare R2 (webp چندسایز)
        </p>
      </div>

      <div className="border-border flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <label className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-sm font-medium">
          {uploading ? "در حال آپلود…" : "آپلود تصویر جدید"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="border-border rounded-xl border px-3 py-2 text-sm"
        >
          تازه‌سازی
        </button>
        {lastUploadUrl ? (
          <a
            href={lastUploadUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary truncate text-xs underline"
          >
            آخرین URL
          </a>
        ) : null}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <AdminBulkBar
          count={selected.length}
          busy={bulkBusy}
          onArchive={() => void runBulkArchive()}
          onHardDelete={() => void runBulkHardDelete()}
          onClear={() => setSelected([])}
        />

      {msg ? <p className="text-muted-foreground text-sm">{msg}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          هنوز تصویری در product_images ثبت نشده. از ویرایش محصول یا آپلود بالا
          اضافه کنید.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key=<label className="inline-flex items-center gap-2"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} /><span>{item.id}</span></label> <button type="button" className="text-muted-foreground text-xs" onClick={() => void archiveOne(item.id, String(item.id || item.id))}>آرشیو</button> <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne(item.id, String(item.id || item.id))}>حذف دائمی</button>
              className="border-border overflow-hidden rounded-xl border bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt_text || ""}
                className="aspect-square w-full object-cover bg-muted"
              />
              <div className="space-y-1 p-2 text-xs">
                <p className="truncate font-medium">
                  {item.product_title || "بدون محصول"}
                </p>
                {item.product_id ? (
                  <Link
                    href={`/admin/products/${item.product_id}/edit`}
                    className="text-primary underline"
                  >
                    ویرایش محصول
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onDelete(item)}
                  className="text-destructive block"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
