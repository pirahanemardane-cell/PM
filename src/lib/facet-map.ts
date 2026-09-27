/** facetهای مجاز بر اساس slug دسته — هم‌تراز با attributes.slug در ادمین مشخصات */
const CORE_FACETS = [
  "fabric",
  "pattern",
  "season",
  "fit",
  "collar",
  "collar-type",
  "sleeve",
  "sleeve-type",
  "thickness",
  "closure",
  "button-type",
  "pocket",
  "occasion",
  "origin",
] as const;

const SHIRT_FACETS = [...CORE_FACETS] as const;

const TIE_FACETS = ["fabric", "pattern", "season", "tie-width", "tie-length"] as const;
const BOW_FACETS = ["fabric", "pattern", "season", "bow-tie-type"] as const;
const CUFF_FACETS = ["cufflink-material"] as const;

export const FACET_BY_CATEGORY: Record<string, string[]> = {
  shirts: [...SHIRT_FACETS],
  "dress-shirts": [...SHIRT_FACETS],
  "casual-shirts": [...SHIRT_FACETS],
  "linen-shirts": [...SHIRT_FACETS],
  "oxford-shirts": [...SHIRT_FACETS],
  overshirts: [...SHIRT_FACETS],
  ties: [...TIE_FACETS],
  "tie-clips": ["fabric", "pattern"],
  "bow-ties": [...BOW_FACETS],
  cufflinks: [...CUFF_FACETS],
  accessories: ["fabric", "pattern", "season", "occasion"],
  "pocket-squares": ["fabric", "pattern"],
  "formal-belts": ["fabric", "pattern"],
  "formal-socks": ["fabric", "pattern", "season"],
};

export const DEFAULT_FACET_SLUGS = [...CORE_FACETS] as const;

export function facetSlugsForCategory(categorySlug?: string): string[] {
  if (!categorySlug) return [...DEFAULT_FACET_SLUGS];
  return FACET_BY_CATEGORY[categorySlug] ?? [...DEFAULT_FACET_SLUGS];
}
