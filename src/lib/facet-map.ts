/** facetهای مجاز بر اساس slug دسته */
const SHIRT_FACETS = [
  "fabric",
  "pattern",
  "season",
  "collar-type",
  "sleeve-type",
  "button-type",
  "fit",
] as const;

const TIE_FACETS = ["fabric", "pattern", "season", "tie-width", "tie-length"] as const;
const BOW_FACETS = ["fabric", "pattern", "season", "bow-tie-type"] as const;
const CUFF_FACETS = ["cufflink-material"] as const;

export const FACET_BY_CATEGORY: Record<string, string[]> = {
  // ریشه و زیر‌دسته‌های پیراهن
  shirts: [...SHIRT_FACETS],
  "dress-shirts": [...SHIRT_FACETS],
  "casual-shirts": [...SHIRT_FACETS],
  "linen-shirts": [...SHIRT_FACETS],
  "oxford-shirts": [...SHIRT_FACETS],
  overshirts: [...SHIRT_FACETS],

  // کروات
  ties: [...TIE_FACETS],
  "tie-clips": ["fabric", "pattern"],

  // پاپیون
  "bow-ties": [...BOW_FACETS],

  // دکمه سردست
  cufflinks: [...CUFF_FACETS],

  // اکسسوری عمومی
  accessories: ["fabric", "pattern", "season"],
  "pocket-squares": ["fabric", "pattern"],
  "formal-belts": ["fabric", "pattern"],
  "formal-socks": ["fabric", "pattern", "season"],
};

export const DEFAULT_FACET_SLUGS = [
  "fabric",
  "pattern",
  "season",
  "collar-type",
  "sleeve-type",
  "button-type",
  "fit",
  "tie-width",
  "tie-length",
  "bow-tie-type",
  "cufflink-material",
] as const;

export function facetSlugsForCategory(categorySlug?: string): string[] {
  if (!categorySlug) return [...DEFAULT_FACET_SLUGS];
  return FACET_BY_CATEGORY[categorySlug] ?? [...DEFAULT_FACET_SLUGS];
}
