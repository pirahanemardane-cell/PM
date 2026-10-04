"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import {
  CONTENT_KEYS,
  DEFAULT_FAQ,
  DEFAULT_PAGES,
  type ContentPageSlug,
  type FaqItem,
  type TextPageContent,
} from "@/lib/content/static-pages";

function asFaq(raw: unknown): FaqItem[] {
  if (!raw || typeof raw !== "object") return DEFAULT_FAQ;
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return DEFAULT_FAQ;
  const out: FaqItem[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const q = String((it as { q?: string }).q || "").trim();
    const a = String((it as { a?: string }).a || "").trim();
    if (q && a) out.push({ q, a });
  }
  return out.length ? out : DEFAULT_FAQ;
}

function asTextPage(slug: ContentPageSlug, raw: unknown): TextPageContent {
  const def = DEFAULT_PAGES[slug] || { title: slug, paragraphs: [] };
  if (!raw || typeof raw !== "object") return def;
  const o = raw as { title?: string; paragraphs?: unknown };
  const title = String(o.title || def.title).trim() || def.title;
  const paragraphs = Array.isArray(o.paragraphs)
    ? o.paragraphs.map((p) => String(p || "").trim()).filter(Boolean)
    : def.paragraphs;
  return { title, paragraphs: paragraphs.length ? paragraphs : def.paragraphs };
}

export async function getFaqContentAction(): Promise<FaqItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", CONTENT_KEYS.faq)
      .maybeSingle();
    if (error || !data?.value) return DEFAULT_FAQ;
    return asFaq(data.value);
  } catch {
    return DEFAULT_FAQ;
  }
}

export async function getTextPageContentAction(
  slug: ContentPageSlug,
): Promise<TextPageContent> {
  const def = DEFAULT_PAGES[slug] || { title: slug, paragraphs: [] };
  if (slug === "faq") return def;
  try {
    const supabase = await createClient();
    const key = CONTENT_KEYS[slug];
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data?.value) return def;
    return asTextPage(slug, data.value);
  } catch {
    return def;
  }
}

export async function adminGetAllContentPagesAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  try {
    const keys = Object.values(CONTENT_KEYS);
    const { data, error } = await gate.supabase
      .from("site_settings")
      .select("key, value")
      .in("key", keys);

    if (error) {
      return {
        ok: true as const,
        faq: DEFAULT_FAQ,
        pages: DEFAULT_PAGES,
        tableMissing: true as const,
      };
    }

    const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));

    return {
      ok: true as const,
      faq: asFaq(map.get(CONTENT_KEYS.faq)),
      pages: {
        terms: asTextPage("terms", map.get(CONTENT_KEYS.terms)),
        privacy: asTextPage("privacy", map.get(CONTENT_KEYS.privacy)),
        shipping: asTextPage("shipping", map.get(CONTENT_KEYS.shipping)),
        returns: asTextPage("returns", map.get(CONTENT_KEYS.returns)),
      } as Record<string, TextPageContent>,
      tableMissing: false as const,
    };
  } catch {
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminSaveFaqAction(items: FaqItem[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const cleaned = (items || [])
    .map((it) => ({
      q: String(it.q || "").trim(),
      a: String(it.a || "").trim(),
    }))
    .filter((it) => it.q && it.a);

  if (!cleaned.length) return { ok: false as const, error: "empty" as const };

  const { error } = await gate.supabase.from("site_settings").upsert(
    {
      key: CONTENT_KEYS.faq,
      value: { items: cleaned },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) {
    console.error("[adminSaveFaq]", error);
    return { ok: false as const, error: "db" as const };
  }
  return { ok: true as const };
}

export async function adminSaveTextPageAction(
  slug: Exclude<ContentPageSlug, "faq">,
  content: TextPageContent,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const key = CONTENT_KEYS[slug];
  if (!key) return { ok: false as const, error: "validation" as const };

  const title = String(content.title || "").trim();
  const paragraphs = (content.paragraphs || [])
    .map((p) => String(p || "").trim())
    .filter(Boolean);

  if (!title || !paragraphs.length) {
    return { ok: false as const, error: "empty" as const };
  }

  const { error } = await gate.supabase.from("site_settings").upsert(
    {
      key,
      value: { title, paragraphs },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) {
    console.error("[adminSaveTextPage]", error);
    return { ok: false as const, error: "db" as const };
  }
  return { ok: true as const };
}
