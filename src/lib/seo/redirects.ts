import { createServiceClient } from "@/lib/supabase/service";

/** مسیر نسبی امن برای جدول ریدایرکت */
export function normalizeRedirectPath(input: string): string | null {
  let s = String(input ?? "").trim();
  if (!s) return null;
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      s = u.pathname || "/";
    }
  } catch {
    /* ignore */
  }
  for (let i = 0; i < 2; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  s = s.replace(/[\u200c\u200e\u200f\ufeff]/g, "").trim();
  if (!s.startsWith("/")) s = `/${s}`;
  // بدون query/hash
  s = s.split("?")[0].split("#")[0];
  // حذف اسلش انتهایی (به‌جز ریشه)
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  // جلوگیری از open redirect
  if (s.includes("//") || s.includes("\\")) return null;
  if (s.length > 500) return null;
  return s;
}

export type RedirectSource =
  | "manual"
  | "product_slug_change"
  | "import"
  | "system";

/**
 * ثبت/به‌روزرسانی ریدایرکت. از service role.
 * اگر from==to باشد هیچ‌کار نمی‌کند.
 */
export async function upsertUrlRedirect(input: {
  fromPath: string;
  toPath: string;
  statusCode?: 301 | 302 | 307 | 308;
  source?: RedirectSource;
  note?: string | null;
  isActive?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const from_path = normalizeRedirectPath(input.fromPath);
  const to_path = normalizeRedirectPath(input.toPath);
  if (!from_path || !to_path) return { ok: false, error: "path_invalid" };
  if (from_path === to_path) return { ok: true };

  try {
    const service = createServiceClient();
    const { error } = await service.from("url_redirects").upsert(
      {
        from_path,
        to_path,
        status_code: input.statusCode ?? 301,
        source: input.source ?? "manual",
        note: input.note ?? null,
        is_active: input.isActive !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "from_path" },
    );
    if (error) {
      console.error("[upsertUrlRedirect]", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("[upsertUrlRedirect]", e);
    return { ok: false, error: "server" };
  }
}

export function productPathFromSlug(slug: string): string {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  return `/products/${s}`;
}
