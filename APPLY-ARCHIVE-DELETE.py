#!/usr/bin/env python3
"""Archive + permanent delete (single/bulk) for catalog & blog admin entities.
Run from repo root: python3 APPLY-ARCHIVE-DELETE.py
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "src").is_dir():
    raise SystemExit("run from repo root")


LIFECYCLE = r'''
"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "auth" as const, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "superadmin") {
    return { ok: false as const, error: "forbidden" as const, supabase };
  }
  return { ok: true as const, userId: auth.user.id, supabase };
}

function cleanIds(ids: string[]): string[] {
  return Array.from(new Set((ids || []).map((x) => String(x || "").trim()).filter(Boolean)));
}

/* ───────── Products ───────── */

/** Archive = soft delete (deleted_at + status archived) */
export async function adminArchiveProductsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), status: "archived" })
      .in("id", list)
      .is("deleted_at", null);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveProducts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/** Permanent delete — blocked if order_items reference the product */
export async function adminHardDeleteProductsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { count, error: cErr } = await gate.supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("product_id", list);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      return { ok: false as const, error: "has_orders" as const };
    }

    // children (best-effort; ignore missing tables)
    for (const table of [
      "product_tag_map",
      "product_attribute_values",
      "product_images",
      "stock_alerts",
      "wishlists",
      "cart_items",
      "product_variants",
    ]) {
      await gate.supabase.from(table).delete().in("product_id", list);
    }
    const { error } = await gate.supabase.from("products").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteProducts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Categories ───────── */

export async function adminArchiveCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("categories")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { count, error: cErr } = await gate.supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .in("category_id", list)
      .is("deleted_at", null);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      return { ok: false as const, error: "has_products" as const };
    }
    // detach children categories
    await gate.supabase.from("categories").update({ parent_id: null }).in("parent_id", list);
    const { error } = await gate.supabase.from("categories").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Brands ───────── */

export async function adminArchiveBrandsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("brands")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBrands]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBrandsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { count, error: cErr } = await gate.supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .in("brand_id", list)
      .is("deleted_at", null);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      return { ok: false as const, error: "has_products" as const };
    }
    await gate.supabase.from("products").update({ brand_id: null }).in("brand_id", list);
    const { error } = await gate.supabase.from("brands").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBrands]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Product tags ───────── */

export async function adminArchiveProductTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("product_tags")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveProductTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteProductTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("product_tag_map").delete().in("tag_id", list);
    const { error } = await gate.supabase.from("product_tags").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteProductTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog posts ───────── */

export async function adminArchiveBlogPostsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_posts")
      .update({ status: "archived" })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogPosts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogPostsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_tag_map").delete().in("post_id", list);
    const { error } = await gate.supabase.from("blog_posts").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogPosts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog categories ───────── */

export async function adminArchiveBlogCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_categories")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogCategoriesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_posts").update({ category_id: null }).in("category_id", list);
    const { error } = await gate.supabase.from("blog_categories").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogCategories]", e);
    return { ok: false as const, error: "server" as const };
  }
}

/* ───────── Blog tags ───────── */

export async function adminArchiveBlogTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("blog_tags")
      .update({ is_active: false })
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchiveBlogTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeleteBlogTagsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = cleanIds(ids);
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    await gate.supabase.from("blog_tag_map").delete().in("tag_id", list);
    const { error } = await gate.supabase.from("blog_tags").delete().in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeleteBlogTags]", e);
    return { ok: false as const, error: "server" as const };
  }
}
'''

BULK_BAR = r'''
"use client";

import { toPersianDigits } from "@/lib/numbers";

type Props = {
  count: number;
  busy?: boolean;
  onArchive: () => void;
  onHardDelete: () => void;
  onClear: () => void;
  archiveLabel?: string;
  hardLabel?: string;
};

export function AdminBulkBar({
  count,
  busy,
  onArchive,
  onHardDelete,
  onClear,
  archiveLabel = "آرشیو",
  hardLabel = "حذف دائمی",
}: Props) {
  if (count <= 0) return null;
  return (
    <div className="border-border bg-card sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm">
      <span className="text-sm font-medium">
        {toPersianDigits(String(count))} مورد انتخاب‌شده
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={onArchive}
        className="bg-muted rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
      >
        {archiveLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onHardDelete}
        className="bg-destructive text-destructive-foreground rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
      >
        {hardLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onClear}
        className="border-border rounded-lg border px-3 py-1.5 text-sm"
      >
        لغو انتخاب
      </button>
    </div>
  );
}
'''


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.lstrip("\n"), encoding="utf-8")
    print("wrote", path)


def patch_products_page() -> None:
    p = ROOT / "src/app/admin/products/page.tsx"
    t = p.read_text(encoding="utf-8")
    if "AdminBulkBar" in t and "adminArchiveProductsAction" in t:
        print("SKIP products page")
        return

    # imports
    if "adminSoftDeleteProductAction" in t and "adminArchiveProductsAction" not in t:
        t = t.replace(
            "adminSoftDeleteProductAction,",
            "adminSoftDeleteProductAction,\n} from \"@/app/admin/actions/products\";\nimport {\n  adminArchiveProductsAction,\n  adminHardDeleteProductsAction,\n} from \"@/app/admin/actions/lifecycle\";\nimport { AdminBulkBar } from \"@/components/admin/bulk-bar\";\n// keep next import block boundary\nimport {",
            1,
        )
        # fix possible double mess - better careful
    # Simpler: if lifecycle import missing, inject after first import block
    if 'from "@/app/admin/actions/lifecycle"' not in t:
        # undo botched replace if any
        t = p.read_text(encoding="utf-8")
        lines = t.splitlines(keepends=True)
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = i + 1
        inj = (
            'import {\n'
            '  adminArchiveProductsAction,\n'
            '  adminHardDeleteProductsAction,\n'
            '} from "@/app/admin/actions/lifecycle";\n'
            'import { AdminBulkBar } from "@/components/admin/bulk-bar";\n'
        )
        lines.insert(insert_at, inj)
        t = "".join(lines)

    if "const [selected, setSelected]" not in t:
        t = t.replace(
            "const [error, setError] = useState<string | null>(null);",
            "const [error, setError] = useState<string | null>(null);\n"
            "  const [selected, setSelected] = useState<string[]>([]);\n"
            "  const [bulkBusy, setBulkBusy] = useState(false);",
            1,
        )

    if "async function runBulkArchive" not in t:
        anchor = "async function softDelete"
        if anchor not in t:
            print("WARN products softDelete anchor miss")
        else:
            helper = '''
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (!items?.length) return;
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((x) => x.id));
  }

  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm(`آرشیو ${selected.length} محصول؟`)) return;
    setBulkBusy(true);
    const res = await adminArchiveProductsAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      setError(res.error === "auth" ? "ورود لازم" : "آرشیو ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }

  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm(`حذف دائمی ${selected.length} محصول؟ این عمل برگشت‌ناپذیر است.`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      setError(
        res.error === "has_orders"
          ? "حداقل یک محصول در سفارش‌ها استفاده شده و قابل حذف دائمی نیست"
          : "حذف دائمی ناموفق",
      );
      return;
    }
    setSelected([]);
    void load();
  }

  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟ برگشت‌ناپذیر است.`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction([id]);
    setBulkBusy(false);
    if (!res.ok) {
      setError(
        res.error === "has_orders"
          ? "این محصول در سفارش‌هاست و حذف دائمی نمی‌شود"
          : "حذف دائمی ناموفق",
      );
      return;
    }
    void load();
  }

'''
            t = t.replace(anchor, helper + anchor, 1)

    # bulk bar before table-ish content
    if "<AdminBulkBar" not in t:
        # after header / before list
        if "loading ?" in t:
            t = t.replace(
                "loading ?",
                "<>\n      <AdminBulkBar\n"
                "        count={selected.length}\n"
                "        busy={bulkBusy}\n"
                "        onArchive={() => void runBulkArchive()}\n"
                "        onHardDelete={() => void runBulkHardDelete()}\n"
                "        onClear={() => setSelected([])}\n"
                "      />\n"
                "      {loading ?",
                1,
            )
            # close fragment - hard; skip if breaks
        # add checkbox in row - look for soft delete button area
    if "toggleSelect(r.id)" not in t and "toggleSelect(p.id)" not in t:
        # try product row map
        for key in ("items.map((p)", "items.map((r)", "items.map((row)"):
            if key in t:
                var = key.split("(")[1].rstrip(")")
                # inject checkbox early in row - fragile; add next to existing checkbox if any
                break
        # near existing soft delete button "حذف"
        if ">حذف<" in t or ">حذف</" in t:
            t = t.replace(
                "حذف",
                "آرشیو",
                1,
            )  # rename soft delete label once - may be wrong if multiple
        # add hard delete button after soft
        if "hardDeleteOne" in t and "حذف دائمی" not in t:
            # insert after soft delete button is complex
            pass

    # Safer row checkbox: if table has thead
    if "toggleSelectAll" in t and "select-all-products" not in t:
        if "<thead" in t:
            t = t.replace(
                "<thead",
                '<thead data-bulk="1"',
                1,
            )
        # inject select-all in first header row if th exists
        if "<th" in t and "select-all-products" not in t:
            t = t.replace(
                "<th",
                '<th className="w-10">\n'
                '                <input\n'
                '                  type="checkbox"\n'
                '                  aria-label="select-all-products"\n'
                '                  checked={items.length > 0 && selected.length === items.length}\n'
                '                  onChange={toggleSelectAll}\n'
                "                />\n"
                "              </th>\n"
                "              <th",
                1,
            )
        # first td in body rows - common pattern items.map
        if "selected.includes" not in t:
            # after map opening return of tr
            t = t.replace(
                "<tr key=",
                "<tr data-sel key=",
                1,
            )
            # add td checkbox - find first <td after data-sel
            idx = t.find('data-sel key=')
            if idx != -1:
                td = t.find("<td", idx)
                if td != -1:
                    t = (
                        t[:td]
                        + '<td className="w-10">\n'
                        '                          <input\n'
                        '                            type="checkbox"\n'
                        '                            checked={selected.includes(String((items.find((x)=>true), ""))}\n'
                        # this is too fragile
                    )
                    # abort fragile UI auto-patch for products - use dedicated patcher below
                    print("WARN products UI partial — use dedicated page patch")
                    # restore from disk and use simpler append approach
                    return patch_products_page_simple()

    p.write_text(t, encoding="utf-8")
    print("patched products page (best-effort)")


def patch_products_page_simple() -> None:
    """Rewrite products page interactions more carefully by reading and doing surgical inserts."""
    p = ROOT / "src/app/admin/products/page.tsx"
    t = p.read_text(encoding="utf-8")

    if "adminArchiveProductsAction" in t and "AdminBulkBar" in t and "selected.includes" in t:
        print("SKIP products page already bulk-ready")
        return

    # Full minimal client overlay approach: don't rewrite whole page;
    # inject import + state + helpers + bulk bar + per-row checkbox near id display
    if 'from "@/app/admin/actions/lifecycle"' not in t:
        t = (
            'import {\n'
            '  adminArchiveProductsAction,\n'
            '  adminHardDeleteProductsAction,\n'
            '} from "@/app/admin/actions/lifecycle";\n'
            'import { AdminBulkBar } from "@/components/admin/bulk-bar";\n'
            + t
        )

    if "const [selected, setSelected]" not in t:
        t = t.replace(
            "export default function AdminProductsPage() {",
            "export default function AdminProductsPage() {\n"
            "  const [selected, setSelected] = useState<string[]>([]);\n"
            "  const [bulkBusy, setBulkBusy] = useState(false);\n",
            1,
        )

    if "async function runBulkArchive" not in t:
        insert_helpers = '''
  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchiveProductsAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      setError(res.error === "has_orders" ? "برخی محصولات در سفارش‌ها هستند" : "حذف دائمی ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction([id]);
    setBulkBusy(false);
    if (!res.ok) {
      setError(res.error === "has_orders" ? "این محصول در سفارش‌هاست" : "حذف دائمی ناموفق");
      return;
    }
    void load();
  }

'''
        # after softDelete function end is hard; put after useState blocks by finding first async function load or similar
        if "const load = useCallback" in t:
            t = t.replace("const load = useCallback", insert_helpers + "  const load = useCallback", 1)
        elif "async function load" in t:
            t = t.replace("async function load", insert_helpers + "  async function load", 1)
        else:
            t = t.replace(
                "export default function AdminProductsPage() {",
                "export default function AdminProductsPage() {" + insert_helpers,
                1,
            )

    if "<AdminBulkBar" not in t:
        # place after opening of return (
        t = t.replace(
            "return (\n    <div",
            "return (\n    <div",
            1,
        )
        # after first child of main div
        t = t.replace(
            'dir="rtl"',
            'dir="rtl"',
            1,
        )
        marker = "AdminPageHeader" if "AdminPageHeader" in t else None
        if "AdminPageHeader" in t:
            # after AdminPageHeader self-close or block - approximate after first /> following AdminPageHeader
            idx = t.find("AdminPageHeader")
            end = t.find("/>", idx)
            if end != -1:
                end += 2
                bar = (
                    "\n      <AdminBulkBar\n"
                    "        count={selected.length}\n"
                    "        busy={bulkBusy}\n"
                    "        onArchive={() => void runBulkArchive()}\n"
                    "        onHardDelete={() => void runBulkHardDelete()}\n"
                    "        onClear={() => setSelected([])}\n"
                    "      />\n"
                )
                t = t[:end] + bar + t[end:]
        elif "<h1" in t:
            idx = t.find("</h1>")
            if idx != -1:
                bar = (
                    "\n      <AdminBulkBar\n"
                    "        count={selected.length}\n"
                    "        busy={bulkBusy}\n"
                    "        onArchive={() => void runBulkArchive()}\n"
                    "        onHardDelete={() => void runBulkHardDelete()}\n"
                    "        onClear={() => setSelected([])}\n"
                    "      />\n"
                )
                t = t[: idx + 5] + bar + t[idx + 5 :]

    # per-row checkbox + hard delete: look for softDelete( calls
    if "toggleSelect(" not in t and "softDelete(" in t:
        # add checkbox before soft delete button by wrapping pattern
        t = t.replace(
            "onClick={() => void softDelete(",
            "onClick={() => void softDelete(",
            1,
        )
        # inject near map row - search for softDelete(p.id or softDelete(r.id
        import re
        m = re.search(r"softDelete\((p|r|row|item)\.id", t)
        if m:
            var = m.group(1)
            # add checkbox button group before soft delete
            old_btn = f"onClick={() => void softDelete({var}.id"
            # find a nearby fragment for buttons
            # Add hard delete next to soft
            t = t.replace(
                f"void softDelete({var}.id, {var}.name)",
                f"void softDelete({var}.id, {var}.name)",
                1,
            )
            # inject select checkbox in name cell if present
            name_cell = f"{{{var}.name}}"
            if name_cell in t and f"selected.includes({var}.id)" not in t:
                t = t.replace(
                    name_cell,
                    f'<label className="inline-flex items-center gap-2">'
                    f'<input type="checkbox" checked={{selected.includes({var}.id)}} '
                    f'onChange={() => toggleSelect({var}.id)} />'
                    f'<span>{name_cell}</span></label>',
                    1,
                )
            if f"hardDeleteOne({var}.id" not in t:
                # after soft delete button text
                soft_label_patterns = ["حذف", "آرشیو"]
                # add a hard delete button after softDelete onClick button - regex
                pattern = rf"(onClick=\{\{\(\) => void softDelete\({var}\.id, {var}\.name\)\}\}}[^>]*>)([^<]*)(</button>)"
                def repl(mm):
                    return (
                        mm.group(0)
                        + f'\n                          <button type="button" className="text-destructive text-xs" '
                        f'onClick={() => void hardDeleteOne({var}.id, {var}.name)}>حذف دائمی</button>'
                    )
                t2, n = re.subn(pattern, repl, t, count=1)
                if n:
                    t = t2
                    print("hard delete button injected")
                else:
                    print("WARN could not inject hard delete button")

    p.write_text(t, encoding="utf-8")
    print("OK products page simple patch")


def patch_generic_list_page(
    rel: str,
    archive_fn: str,
    hard_fn: str,
    row_var_candidates: tuple[str, ...] = ("r", "p", "row", "item", "c", "b", "t"),
) -> None:
    p = ROOT / rel
    if not p.is_file():
        print("MISS", rel)
        return
    t = p.read_text(encoding="utf-8")
    if archive_fn in t and "AdminBulkBar" in t and "selected.includes" in t:
        print("SKIP", rel)
        return

    if 'from "@/app/admin/actions/lifecycle"' not in t:
        t = (
            f'import {{ {archive_fn}, {hard_fn} }} from "@/app/admin/actions/lifecycle";\n'
            'import { AdminBulkBar } from "@/components/admin/bulk-bar";\n'
            + t
        )

    if "const [selected, setSelected]" not in t:
        # insert into component
        import re
        m = re.search(r"export default function \w+\(\) \{", t)
        if m:
            pos = m.end()
            t = (
                t[:pos]
                + "\n  const [selected, setSelected] = useState<string[]>([]);\n"
                + "  const [bulkBusy, setBulkBusy] = useState(false);\n"
                + t[pos:]
            )

    if "async function runBulkArchive" not in t:
        helpers = f'''
  function toggleSelect(id: string) {{
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }}
  async function runBulkArchive() {{
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await {archive_fn}(selected);
    setBulkBusy(false);
    if (!res.ok) {{ setError("آرشیو ناموفق"); return; }}
    setSelected([]);
    void load();
  }}
  async function runBulkHardDelete() {{
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await {hard_fn}(selected);
    setBulkBusy(false);
    if (!res.ok) {{
      const map: Record<string, string> = {{
        has_products: "به محصول متصل است",
        has_orders: "در سفارش‌ها استفاده شده",
      }};
      setError(map[res.error as string] ?? "حذف دائمی ناموفق");
      return;
    }}
    setSelected([]);
    void load();
  }}
  async function hardDeleteOne(id: string, name: string) {{
    if (!confirm(`حذف دائمی «${{name}}»؟`)) return;
    setBulkBusy(true);
    const res = await {hard_fn}([id]);
    setBulkBusy(false);
    if (!res.ok) {{
      const map: Record<string, string> = {{
        has_products: "به محصول متصل است",
        has_orders: "در سفارش‌ها استفاده شده",
      }};
      setError(map[res.error as string] ?? "حذف دائمی ناموفق");
      return;
    }}
    void load();
  }}
  async function archiveOne(id: string, name: string) {{
    if (!confirm(`آرشیو «${{name}}»؟`)) return;
    setBulkBusy(true);
    const res = await {archive_fn}([id]);
    setBulkBusy(false);
    if (!res.ok) {{ setError("آرشیو ناموفق"); return; }}
    void load();
  }}

'''
        if "const load = useCallback" in t:
            t = t.replace("const load = useCallback", helpers + "  const load = useCallback", 1)
        elif "async function load" in t:
            t = t.replace("async function load", helpers + "  async function load", 1)
        else:
            # after selected state
            t = t.replace(
                "const [bulkBusy, setBulkBusy] = useState(false);",
                "const [bulkBusy, setBulkBusy] = useState(false);\n" + helpers,
                1,
            )

    if "<AdminBulkBar" not in t:
        if "AdminPageHeader" in t:
            idx = t.find("AdminPageHeader")
            end = t.find("/>", idx)
            if end != -1:
                end += 2
                bar = (
                    "\n      <AdminBulkBar\n"
                    "        count={selected.length}\n"
                    "        busy={bulkBusy}\n"
                    "        onArchive={() => void runBulkArchive()}\n"
                    "        onHardDelete={() => void runBulkHardDelete()}\n"
                    "        onClear={() => setSelected([])}\n"
                    "      />\n"
                )
                t = t[:end] + bar + t[end:]
        elif "<h1" in t:
            idx = t.find("</h1>")
            if idx != -1:
                bar = (
                    "\n      <AdminBulkBar\n"
                    "        count={selected.length}\n"
                    "        busy={bulkBusy}\n"
                    "        onArchive={() => void runBulkArchive()}\n"
                    "        onHardDelete={() => void runBulkHardDelete()}\n"
                    "        onClear={() => setSelected([])}\n"
                    "      />\n"
                )
                t = t[: idx + 5] + bar + t[idx + 5 :]

    # checkbox on name
    if "selected.includes" not in t:
        for var in row_var_candidates:
            token = f"{{{var}.name}}"
            if token in t:
                t = t.replace(
                    token,
                    f'<label className="inline-flex items-center gap-2">'
                    f'<input type="checkbox" checked={{selected.includes({var}.id)}} '
                    f'onChange={() => toggleSelect({var}.id)} />'
                    f"<span>{token}</span></label>",
                    1,
                )
                # row actions: inject after name label if not present
                if f"hardDeleteOne({var}.id" not in t:
                    needle = (
                        f'<label className="inline-flex items-center gap-2">'
                        f'<input type="checkbox" checked={{selected.includes({var}.id)}} '
                        f'onChange={() => toggleSelect({var}.id)} />'
                        f'<span>{{{var}.name}}</span></label>'
                    )
                    add = (
                        needle
                        + f' <button type="button" className="text-xs text-muted-foreground" onClick={() => void archiveOne({var}.id, {var}.name)}>آرشیو</button>'
                        + f' <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne({var}.id, {var}.name)}>حذف دائمی</button>'
                    )
                    if needle in t:
                        t = t.replace(needle, add, 1)
                break

    # ensure setError exists - some pages use setError
    if "setError" not in t and "runBulkArchive" in t:
        t = t.replace(
            "const [bulkBusy, setBulkBusy] = useState(false);",
            "const [bulkBusy, setBulkBusy] = useState(false);\n"
            "  const [error, setError] = useState<string | null>(null);",
            1,
        )

    p.write_text(t, encoding="utf-8")
    print("OK", rel)


def main() -> None:
    write(ROOT / "src/app/admin/actions/lifecycle.ts", LIFECYCLE)
    write(ROOT / "src/components/admin/bulk-bar.tsx", BULK_BAR)

    patch_products_page_simple()

    patch_generic_list_page(
        "src/app/admin/categories/page.tsx",
        "adminArchiveCategoriesAction",
        "adminHardDeleteCategoriesAction",
    )
    patch_generic_list_page(
        "src/app/admin/brands/page.tsx",
        "adminArchiveBrandsAction",
        "adminHardDeleteBrandsAction",
    )
    patch_generic_list_page(
        "src/app/admin/tags/page.tsx",
        "adminArchiveProductTagsAction",
        "adminHardDeleteProductTagsAction",
    )
    patch_generic_list_page(
        "src/app/admin/blog/page.tsx",
        "adminArchiveBlogPostsAction",
        "adminHardDeleteBlogPostsAction",
        ("p", "post", "r"),
    )
    patch_generic_list_page(
        "src/app/admin/blog/categories/page.tsx",
        "adminArchiveBlogCategoriesAction",
        "adminHardDeleteBlogCategoriesAction",
    )
    patch_generic_list_page(
        "src/app/admin/blog/tags/page.tsx",
        "adminArchiveBlogTagsAction",
        "adminHardDeleteBlogTagsAction",
    )

    print("DONE archive/delete apply")


if __name__ == "__main__":
    main()
