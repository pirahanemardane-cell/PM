import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryService } from "@/services/category.service";
import { BrandService } from "@/services/brand.service";
import { RESERVED_ROOT_SEGMENTS } from "@/lib/seo/fa-routes";
import CategoryListingPage, {
  generateMetadata as categoryMeta,
} from "../categories/[slug]/page";
import BrandListingPage, {
  generateMetadata as brandMeta,
} from "../brands/[slug]/page";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function decodeSlug(raw: string): string {
  let s = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return s;
}

const RESERVED = new Set(RESERVED_ROOT_SEGMENTS.filter(Boolean));

async function resolvedProps(props: Props): Promise<Props> {
  const raw = (await props.params).slug;
  const slug = decodeSlug(raw);
  return {
    params: Promise.resolve({ slug }),
    searchParams: props.searchParams,
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const slug = decodeSlug((await props.params).slug);
  if (RESERVED.has(slug)) return {};

  const fixed = await resolvedProps(props);

  const brandService = new BrandService();
  const brand = await brandService.getBySlug(slug);
  if (brand.success && brand.data) {
    return brandMeta(fixed);
  }

  const categoryService = new CategoryService();
  const cat = await categoryService.getBySlug(slug);
  if (cat.success && cat.data) {
    return categoryMeta(fixed);
  }

  return { title: "یافت نشد" };
}

export default async function RootSlugPage(props: Props) {
  const slug = decodeSlug((await props.params).slug);
  if (RESERVED.has(slug)) notFound();

  const fixed = await resolvedProps(props);

  // برند را اول چک کن تا با اسلاگ مشترک دسته تداخل کمتر شود
  const brandService = new BrandService();
  const brand = await brandService.getBySlug(slug);
  if (brand.success && brand.data) {
    return BrandListingPage(fixed);
  }

  const categoryService = new CategoryService();
  const cat = await categoryService.getBySlug(slug);
  if (cat.success && cat.data) {
    return CategoryListingPage(fixed);
  }

  notFound();
}
