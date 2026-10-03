/**
 * Real-time SEO + readability analysis (Stage 1).
 * Pixel-based length checks for title / meta description.
 */

import {
  measurePixelWidth,
  titlePixelStatus,
  descPixelStatus,
  PIXEL_LIMITS,
} from "./pixel";

export type SeoCheck = {
  id: string;
  label: string;
  status: "good" | "ok" | "bad" | "na";
  message: string;
};

export type SeoAnalysisInput = {
  keyphrases: string[];
  title: string;
  metaDescription: string;
  h1?: string;
  intro?: string;
  body?: string;
  forceNoindex?: boolean;
  robotsIndex?: boolean;
};

export type SeoAnalysisResult = {
  score: number;
  readabilityScore: number;
  checks: SeoCheck[];
  titlePx: number;
  descPx: number;
  titleStatus: "ok" | "warn" | "over";
  descStatus: "ok" | "warn" | "over";
  density: number;
  wordCount: number;
};

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n || n.length < 2) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const found = h.indexOf(n, idx);
    if (found === -1) break;
    count++;
    idx = found + n.length;
  }
  return count;
}

function words(text: string): string[] {
  return stripHtml(text)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

function sentences(text: string): string[] {
  return stripHtml(text)
    .split(/[.!?؟۔\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function paragraphs(text: string): string[] {
  return stripHtml(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function extractHeadings(html: string): string {
  const matches = (html || "").match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || [];
  return matches.map((m) => stripHtml(m)).join(" ");
}

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysisResult {
  const keyphrases = (input.keyphrases || [])
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 5);
  const primary = keyphrases[0] || "";

  const title = input.title || "";
  const meta = input.metaDescription || "";
  const h1 = input.h1 || "";
  const intro = input.intro || "";
  const bodyRaw = input.body || "";
  const bodyText = stripHtml(bodyRaw);
  const headingsText = extractHeadings(bodyRaw) + " " + h1;
  const fullText = [title, meta, h1, intro, bodyText].join(" ");

  const titlePx = measurePixelWidth(title);
  const descPx = measurePixelWidth(meta);
  const tStatus = titlePixelStatus(titlePx);
  const dStatus = descPixelStatus(descPx, false);

  const wordList = words(bodyText || intro);
  const wordCount = wordList.length;
  const primaryCount = primary ? countOccurrences(fullText, primary) : 0;
  const density =
    wordCount > 0 && primary
      ? Math.round((primaryCount / Math.max(wordCount, 1)) * 1000) / 10
      : 0;

  const checks: SeoCheck[] = [];

  if (!title.trim()) {
    checks.push({
      id: "title_empty",
      label: "عنوان SEO",
      status: "bad",
      message: "عنوان (Title) خالی است.",
    });
  } else if (tStatus === "over") {
    checks.push({
      id: "title_px",
      label: "طول عنوان (پیکسل)",
      status: "bad",
      message: `عنوان حدود ${titlePx}px است؛ حد دسکتاپ گوگل ~${PIXEL_LIMITS.titleDesktop}px. کوتاه‌تر کنید.`,
    });
  } else if (tStatus === "warn") {
    checks.push({
      id: "title_px",
      label: "طول عنوان (پیکسل)",
      status: "ok",
      message: `عنوان ${titlePx}px — نزدیک به حد؛ بهتر است ≤${PIXEL_LIMITS.titleDesktopSafe}px باشد.`,
    });
  } else {
    checks.push({
      id: "title_px",
      label: "طول عنوان (پیکسل)",
      status: "good",
      message: `عنوان ${titlePx}px — در محدوده امن گوگل.`,
    });
  }

  if (primary && title.trim()) {
    const inTitle = countOccurrences(title, primary) > 0;
    checks.push({
      id: "kp_title",
      label: "کلیدواژه در عنوان",
      status: inTitle ? "good" : "bad",
      message: inTitle
        ? "کلیدواژه اصلی در Title آمده است."
        : "کلیدواژه اصلی در Title نیست.",
    });
  }

  if (!meta.trim()) {
    checks.push({
      id: "desc_empty",
      label: "توضیح متا",
      status: "bad",
      message: "Meta Description خالی است.",
    });
  } else if (dStatus === "over") {
    checks.push({
      id: "desc_px",
      label: "طول توضیح متا (پیکسل)",
      status: "bad",
      message: `توضیح حدود ${descPx}px است؛ حد دسکتاپ ~${PIXEL_LIMITS.descDesktop}px.`,
    });
  } else if (dStatus === "warn") {
    checks.push({
      id: "desc_px",
      label: "طول توضیح متا (پیکسل)",
      status: "ok",
      message: `توضیح ${descPx}px — کمی بلند؛ هدف امن ≤۹۰۰px.`,
    });
  } else {
    checks.push({
      id: "desc_px",
      label: "طول توضیح متا (پیکسل)",
      status: "good",
      message: `توضیح ${descPx}px — مناسب.`,
    });
  }

  if (primary && meta.trim()) {
    const inMeta = countOccurrences(meta, primary) > 0;
    checks.push({
      id: "kp_meta",
      label: "کلیدواژه در متا",
      status: inMeta ? "good" : "ok",
      message: inMeta
        ? "کلیدواژه در Meta Description آمده است."
        : "کلیدواژه در Meta Description نیست (پیشنهادی).",
    });
  }

  if (h1.trim()) {
    if (primary) {
      const inH1 = countOccurrences(h1, primary) > 0;
      checks.push({
        id: "kp_h1",
        label: "کلیدواژه در H1",
        status: inH1 ? "good" : "ok",
        message: inH1
          ? "کلیدواژه در عنوان صفحه (H1) هست."
          : "کلیدواژه در H1 نیست.",
      });
    }
  } else {
    checks.push({
      id: "h1_missing",
      label: "H1",
      status: "ok",
      message: "H1 جداگانه مشخص نشده (از نام صفحه استفاده می‌شود).",
    });
  }

  if (intro.trim() && primary) {
    const inIntro = countOccurrences(intro.slice(0, 300), primary) > 0;
    checks.push({
      id: "kp_intro",
      label: "کلیدواژه در مقدمه",
      status: inIntro ? "good" : "ok",
      message: inIntro
        ? "کلیدواژه در ابتدای محتوا آمده است."
        : "بهتر است کلیدواژه در پاراگراف اول باشد.",
    });
  }

  if (bodyText && primary) {
    const inHead = countOccurrences(headingsText, primary) > 0;
    checks.push({
      id: "kp_headings",
      label: "کلیدواژه در سرتیترها",
      status: inHead ? "good" : "ok",
      message: inHead
        ? "کلیدواژه در حداقل یک heading هست."
        : "کلیدواژه در headings دیده نشد.",
    });
  }

  if (primary && wordCount >= 50) {
    if (density < 0.5) {
      checks.push({
        id: "density",
        label: "چگالی کلیدواژه",
        status: "ok",
        message: `چگالی ${density}% — کمی کم (هدف حدود ۰٫۵٪ تا ۲٫۵٪).`,
      });
    } else if (density > 3.5) {
      checks.push({
        id: "density",
        label: "چگالی کلیدواژه",
        status: "bad",
        message: `چگالی ${density}% — زیاد (ممکن است keyword stuffing تلقی شود).`,
      });
    } else {
      checks.push({
        id: "density",
        label: "چگالی کلیدواژه",
        status: "good",
        message: `چگالی ${density}% — مناسب.`,
      });
    }
  } else if (primary && wordCount > 0 && wordCount < 50) {
    checks.push({
      id: "density",
      label: "چگالی کلیدواژه",
      status: "ok",
      message: "متن کوتاه است؛ چگالی هنوز قابل اتکا نیست.",
    });
  }

  if (wordCount === 0) {
    checks.push({
      id: "length",
      label: "طول محتوا",
      status: "ok",
      message: "متن بدنه خالی یا خیلی کوتاه است.",
    });
  } else if (wordCount < 100) {
    checks.push({
      id: "length",
      label: "طول محتوا",
      status: "ok",
      message: `حدود ${wordCount} کلمه — برای صفحات مهم بهتر است بیشتر باشد.`,
    });
  } else {
    checks.push({
      id: "length",
      label: "طول محتوا",
      status: "good",
      message: `حدود ${wordCount} کلمه.`,
    });
  }

  const sents = sentences(bodyText || intro);
  const paras = paragraphs(bodyText || intro);
  let longSentences = 0;
  let totalSentLen = 0;
  for (const s of sents) {
    const wc = words(s).length;
    totalSentLen += wc;
    if (wc > 25) longSentences++;
  }
  const avgSent = sents.length ? totalSentLen / sents.length : 0;
  let longParas = 0;
  for (const p of paras) {
    if (words(p).length > 150) longParas++;
  }

  let readabilityScore = 70;
  if (avgSent > 22) readabilityScore -= 15;
  else if (avgSent > 18) readabilityScore -= 8;
  else if (avgSent > 0 && avgSent <= 15) readabilityScore += 10;
  if (longSentences > 3) readabilityScore -= 10;
  if (longParas > 0) readabilityScore -= 8;
  if (wordCount > 0 && wordCount < 50) readabilityScore -= 10;
  if (wordCount >= 200) readabilityScore += 5;
  readabilityScore = Math.max(0, Math.min(100, Math.round(readabilityScore)));

  checks.push({
    id: "readability",
    label: "خوانایی",
    status:
      readabilityScore >= 70 ? "good" : readabilityScore >= 50 ? "ok" : "bad",
    message: `امتیاز خوانایی ${readabilityScore}/100 — میانگین طول جمله ≈ ${avgSent ? avgSent.toFixed(1) : "—"} کلمه.`,
  });

  if (!primary) {
    checks.push({
      id: "kp_missing",
      label: "کلیدواژه کانونی",
      status: "bad",
      message: "حداقل یک Focus Keyphrase وارد کنید.",
    });
  }

  if (input.forceNoindex || input.robotsIndex === false) {
    checks.push({
      id: "robots",
      label: "ایندکس",
      status: "ok",
      message: "این صفحه noindex است و در نتایج جستجو ایندکس نمی‌شود.",
    });
  }

  let score = 0;
  let weight = 0;
  for (const c of checks) {
    const w =
      c.id.startsWith("kp_") || c.id.includes("title") || c.id.includes("desc")
        ? 2
        : 1;
    weight += w;
    if (c.status === "good") score += 100 * w;
    else if (c.status === "ok") score += 55 * w;
    else if (c.status === "na") score += 70 * w;
    else score += 15 * w;
  }
  const finalScore = weight ? Math.round(score / weight) : 0;

  return {
    score: finalScore,
    readabilityScore,
    checks,
    titlePx,
    descPx,
    titleStatus: tStatus,
    descStatus: dStatus,
    density,
    wordCount,
  };
}
