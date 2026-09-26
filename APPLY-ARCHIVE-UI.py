#!/usr/bin/env python3
"""Wire archive/hard-delete bulk UI into admin list pages. Run from repo root."""
from __future__ import annotations

from pathlib import Path

ROOT = Path.cwd()
assert (ROOT / "src").is_dir(), "run from repo root"


def ensure_import(t: str, snippet: str) -> str:
    if snippet.strip() in t:
        return t
    # after "use client" block imports — insert after first import cluster
    if t.startswith('"use client"'):
        # find last consecutive import at top
        lines = t.splitlines(keepends=True)
        last_imp = 0
        for i, line in enumerate(lines):
            if line.startswith("import ") or (
                i > 0
                and lines[i - 1].strip().endswith("{")
                and ("from " in line or line.strip().startswith("}"))
            ):
                last_imp = i
            elif line.startswith("import "):
                last_imp = i
            elif i > 2 and last_imp and not line.startswith(" ") and not line.startswith("\t"):
                if not (line.startswith("import") or line.strip() == "" or "from " in line):
                    break
        # simpler: insert after line 2 (use client + blank)
        insert_at = 1
        for i, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = i + 1
            elif insert_at > 1 and line.strip() == "":
                continue
            elif insert_at > 1 and not line.startswith("import"):
                break
        lines.insert(insert_at, snippet if snippet.endswith("\n") else snippet + "\n")
        return "".join(lines)
    return snippet + t


def inject_state(t: str) -> str:
    if "const [selected, setSelected]" in t:
        return t
    needle = "const [error, setError] = useState<string | null>(null);"
    if needle in t:
        return t.replace(
            needle,
            needle
            + "\n  const [selected, setSelected] = useState<string[]>([]);\n"
            + "  const [bulkBusy, setBulkBusy] = useState(false);",
            1,
        )
    # blog tags has no error state
    needle2 = "const [items, setItems] = useState"
    idx = t.find(needle2)
    if idx != -1:
        # find end of that line
        end = t.find("\n", idx)
        return (
            t[: end + 1]
            + "  const [selected, setSelected] = useState<string[]>([]);\n"
            + "  const [bulkBusy, setBulkBusy] = useState(false);\n"
            + "  const [error, setError] = useState<string | null>(null);\n"
            + t[end + 1 :]
        )
    return t


def inject_helpers(t: str, archive_fn: str, hard_fn: str) -> str:
    if "async function runBulkArchive" in t:
        return t
    helpers = (
        "\n  function toggleSelect(id: string) {\n"
        "    setSelected((prev) =>\n"
        "      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],\n"
        "    );\n"
        "  }\n"
        "  async function runBulkArchive() {\n"
        "    if (!selected.length) return;\n"
        '    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;\n'
        "    setBulkBusy(true);\n"
        "    const res = await " + archive_fn + "(selected);\n"
        "    setBulkBusy(false);\n"
        '    if (!res.ok) { setError("آرشیو ناموفق"); return; }\n'
        "    setSelected([]);\n"
        "    void load();\n"
        "  }\n"
        "  async function runBulkHardDelete() {\n"
        "    if (!selected.length) return;\n"
        '    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;\n'
        "    setBulkBusy(true);\n"
        "    const res = await " + hard_fn + "(selected);\n"
        "    setBulkBusy(false);\n"
        "    if (!res.ok) {\n"
        "      const map: Record<string, string> = {\n"
        '        has_products: "به محصول متصل است",\n'
        '        has_orders: "در سفارش‌ها استفاده شده",\n'
        "      };\n"
        '      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");\n'
        "      return;\n"
        "    }\n"
        "    setSelected([]);\n"
        "    void load();\n"
        "  }\n"
        "  async function archiveOne(id: string, name: string) {\n"
        "    if (!confirm(`آرشیو «${name}»؟`)) return;\n"
        "    setBulkBusy(true);\n"
        "    const res = await " + archive_fn + "([id]);\n"
        "    setBulkBusy(false);\n"
        '    if (!res.ok) { setError("آرشیو ناموفق"); return; }\n'
        "    void load();\n"
        "  }\n"
        "  async function hardDeleteOne(id: string, name: string) {\n"
        "    if (!confirm(`حذف دائمی «${name}»؟`)) return;\n"
        "    setBulkBusy(true);\n"
        "    const res = await " + hard_fn + "([id]);\n"
        "    setBulkBusy(false);\n"
        "    if (!res.ok) {\n"
        "      const map: Record<string, string> = {\n"
        '        has_products: "به محصول متصل است",\n'
        '        has_orders: "در سفارش‌ها استفاده شده",\n'
        "      };\n"
        '      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");\n'
        "      return;\n"
        "    }\n"
        "    void load();\n"
        "  }\n"
    )
    if "const load = useCallback" in t:
        return t.replace("const load = useCallback", helpers + "  const load = useCallback", 1)
    if "async function load(" in t:
        return t.replace("async function load(", helpers + "  async function load(", 1)
    if "async function load()" in t:
        return t.replace("async function load()", helpers + "  async function load()", 1)
    # fallback before return (
    return t.replace("\n  return (", helpers + "\n  return (", 1)


def inject_bulk_bar(t: str) -> str:
    if "<AdminBulkBar" in t:
        return t
    bar = (
        "\n        <AdminBulkBar\n"
        "          count={selected.length}\n"
        "          busy={bulkBusy}\n"
        "          onArchive={() => void runBulkArchive()}\n"
        "          onHardDelete={() => void runBulkHardDelete()}\n"
        "          onClear={() => setSelected([])}\n"
        "        />\n"
    )
    # after error line if present
    if '{error ? <p className="text-destructive text-sm">{error}</p> : null}' in t:
        return t.replace(
            '{error ? <p className="text-destructive text-sm">{error}</p> : null}',
            '{error ? <p className="text-destructive text-sm">{error}</p> : null}' + bar,
            1,
        )
    # after header h1 block
    if "</h1>" in t:
        idx = t.find("</h1>")
        return t[: idx + 5] + bar + t[idx + 5 :]
    return t


def wire_row(t: str, var: str, name_field: str = "name") -> str:
    """Add checkbox on name cell + archive/hard buttons."""
    if "selected.includes(" + var + ".id)" in t:
        return t
    token = "{" + var + "." + name_field + "}"
    actions = (
        ' <button type="button" className="text-muted-foreground text-xs" '
        "onClick={() => void archiveOne(" + var + ".id, " + var + "." + name_field + ")}"
        ">آرشیو</button>"
        ' <button type="button" className="text-destructive text-xs" '
        "onClick={() => void hardDeleteOne(" + var + ".id, " + var + "." + name_field + ")}"
        ">حذف دائمی</button>"
    )
    if token in t:
        replacement = (
            '<label className="inline-flex items-center gap-2">'
            '<input type="checkbox" checked={selected.includes(' + var + ".id)} "
            "onChange={() => toggleSelect(" + var + ".id)} />"
            "<span>" + token + "</span></label>"
            + actions
        )
        return t.replace(token, replacement, 1)

    # categories/brands: defaultValue={r.name}
    dv = "defaultValue={" + var + "." + name_field + "}"
    if dv in t:
        cb = (
            '<input type="checkbox" className="ml-2" checked={selected.includes('
            + var
            + ".id)} onChange={() => toggleSelect("
            + var
            + ".id)} />"
        )
        idx = t.find(dv)
        start = t.rfind("<input", 0, idx)
        if start != -1:
            t = t[:start] + cb + t[start:]
        idx2 = t.find(dv)
        gt = t.find(">", idx2)
        if gt != -1:
            t = t[: gt + 1] + actions + t[gt + 1 :]
        return t

    print("  WARN name token missing for", var, name_field)
    return t


def patch_page(
    rel: str,
    archive_fn: str,
    hard_fn: str,
    row_var: str,
    name_field: str = "name",
) -> None:
    p = ROOT / rel
    if not p.is_file():
        print("MISS", rel)
        return
    t = p.read_text(encoding="utf-8")
    if "AdminBulkBar" in t and archive_fn in t and "selected.includes" in t:
        print("SKIP", rel)
        return

    imp = (
        'import { AdminBulkBar } from "@/components/admin/bulk-bar";\n'
        "import {\n"
        "  " + archive_fn + ",\n"
        "  " + hard_fn + ",\n"
        '} from "@/app/admin/actions/lifecycle";\n'
    )
    t = ensure_import(t, imp)
    t = inject_state(t)
    t = inject_helpers(t, archive_fn, hard_fn)
    t = inject_bulk_bar(t)
    t = wire_row(t, row_var, name_field)
    p.write_text(t, encoding="utf-8")
    print("OK", rel)


def main() -> None:
    patch_page(
        "src/app/admin/products/page.tsx",
        "adminArchiveProductsAction",
        "adminHardDeleteProductsAction",
        "p",
    )
    patch_page(
        "src/app/admin/categories/page.tsx",
        "adminArchiveCategoriesAction",
        "adminHardDeleteCategoriesAction",
        "r",
    )
    # categories may use different var
    p = ROOT / "src/app/admin/categories/page.tsx"
    if p.is_file() and "selected.includes" not in p.read_text(encoding="utf-8"):
        t = p.read_text(encoding="utf-8")
        for var in ("r", "c", "row", "item"):
            if "{" + var + ".name}" in t:
                t = wire_row(t, var)
                p.write_text(t, encoding="utf-8")
                print("retry wire categories", var)
                break

    patch_page(
        "src/app/admin/brands/page.tsx",
        "adminArchiveBrandsAction",
        "adminHardDeleteBrandsAction",
        "r",
    )
    p = ROOT / "src/app/admin/brands/page.tsx"
    if p.is_file() and "selected.includes" not in p.read_text(encoding="utf-8"):
        t = p.read_text(encoding="utf-8")
        for var in ("r", "b", "row", "item"):
            if "{" + var + ".name}" in t:
                t = wire_row(t, var)
                p.write_text(t, encoding="utf-8")
                print("retry wire brands", var)
                break

    patch_page(
        "src/app/admin/tags/page.tsx",
        "adminArchiveProductTagsAction",
        "adminHardDeleteProductTagsAction",
        "t",
    )
    p = ROOT / "src/app/admin/tags/page.tsx"
    if p.is_file() and "selected.includes" not in p.read_text(encoding="utf-8"):
        t = p.read_text(encoding="utf-8")
        for var in ("t", "tag", "r", "item"):
            if "{" + var + ".name}" in t:
                t = wire_row(t, var)
                p.write_text(t, encoding="utf-8")
                print("retry wire tags", var)
                break

    patch_page(
        "src/app/admin/blog/page.tsx",
        "adminArchiveBlogPostsAction",
        "adminHardDeleteBlogPostsAction",
        "p",
        name_field="title",
    )
    # blog posts use title
    p = ROOT / "src/app/admin/blog/page.tsx"
    if p.is_file() and "selected.includes" not in p.read_text(encoding="utf-8"):
        t = p.read_text(encoding="utf-8")
        for var, field in (("p", "title"), ("post", "title"), ("r", "title")):
            if "{" + var + "." + field + "}" in t:
                t = wire_row(t, var, field)
                p.write_text(t, encoding="utf-8")
                print("retry wire blog", var)
                break

    patch_page(
        "src/app/admin/blog/categories/page.tsx",
        "adminArchiveBlogCategoriesAction",
        "adminHardDeleteBlogCategoriesAction",
        "c",
    )
    p = ROOT / "src/app/admin/blog/categories/page.tsx"
    if p.is_file() and "selected.includes" not in p.read_text(encoding="utf-8"):
        t = p.read_text(encoding="utf-8")
        for var in ("c", "r", "row", "item"):
            if "{" + var + ".name}" in t:
                t = wire_row(t, var)
                p.write_text(t, encoding="utf-8")
                print("retry wire blog cat", var)
                break

    patch_page(
        "src/app/admin/blog/tags/page.tsx",
        "adminArchiveBlogTagsAction",
        "adminHardDeleteBlogTagsAction",
        "t",
    )

    print("UI DONE")


if __name__ == "__main__":
    main()
