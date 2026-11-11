"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";

const FRAME_COUNT = 70;
const SCROLL_VH = 320;

/** بازه‌های متن (ایندکس فریم ۰-based، مطابق اسکراب فعلی) */
const SLIDES = [
  { start: 0, end: 23, text: "استایلی که فکر شده" },
  { start: 24, end: 48, text: "انواع کیفیت و برند" },
  { start: 48, end: 69, text: "پیراهن مردانه" },
] as const;

/** کراس‌فید نرم‌تر بین اسلایدها — حس شادجیل */
const FADE_FRAMES = 5.5;
const BUTTON_FROM = 48;
const SOFT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.webp`;
}

/** opacity نرم داخل بازه [start, end] */
function rangeOpacity(idx: number, start: number, end: number, fade = FADE_FRAMES) {
  if (idx < start - 0.001 || idx > end + 0.001) return 0;
  const fadeIn = Math.min(1, Math.max(0, (idx - start) / fade));
  const fadeOut = Math.min(1, Math.max(0, (end - idx) / fade));
  // ease-in-out soft curve so scrub feels less stepped
  const soft = (t: number) => t * t * (3 - 2 * t);
  return Math.min(soft(fadeIn), soft(fadeOut));
}

/** سایز دسکتاپ فقط — موبایل همان clamp والد؛ وزن تایپ نرم‌تر از black مطلق */
function TitleContent({ text }: { text: string }) {
  if (text === "استایلی که فکر شده") {
    return (
      <>
        <span className="text-[40px] font-extrabold text-white md:text-[55px] lg:text-[90px]">
          استایلی
        </span>{" "}
        <span className="text-[20px] font-thin text-white/95 md:text-[30px] lg:text-[40px]">
          که فکر شده
        </span>
      </>
    );
  }
  if (text === "انواع کیفیت و برند") {
    return (
      <>
        <span className="text-[20px] font-thin text-white/95 md:text-[30px] lg:text-[40px]">
          انواع
        </span>{" "}
        <span className="text-[40px] font-extrabold text-white md:text-[55px] lg:text-[90px]">
          کیفیت و برند
        </span>
      </>
    );
  }
  if (text === "پیراهن مردانه") {
    return (
      <span className="text-[40px] font-black tracking-tight text-white md:text-[55px] lg:text-[90px]">
        پیراهن مردانه
      </span>
    );
  }
  return <>{text}</>;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));
  const lastIdxRef = useRef(-1);
  const introFiredRef = useRef(false);
  const rafRef = useRef(0);
  const [firstReady, setFirstReady] = useState(false);
  const [mediaSoftIn, setMediaSoftIn] = useState(false);
  /** fractional scrub for soft text/button fades; canvas still uses integers */
  const [scrub, setScrub] = useState(0);

  const drawIndex = useCallback((idx: number, force = false) => {
    if (!force && idx === lastIdxRef.current) return;
    lastIdxRef.current = idx;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let img = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[idx - d];
        const b = imagesRef.current[idx + d];
        if (a?.complete && a.naturalWidth) {
          img = a;
          break;
        }
        if (b?.complete && b.naturalWidth) {
          img = b;
          break;
        }
      }
    }
    if (!img?.complete || !img.naturalWidth) return;
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tw = Math.floor(w * dpr);
    const th = Math.floor(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Slightly softer crop than before; gentle breathe with scrub progress
    const progress = idx / Math.max(1, FRAME_COUNT - 1);
    const zoom = 1.045 + progress * 0.035;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw: number;
    let dh: number;
    if (ir > cr) {
      dh = h * zoom;
      dw = dh * ir;
    } else {
      dw = w * zoom;
      dh = dw / ir;
    }
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  useEffect(() => {
    const imgs: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    imagesRef.current = imgs;
    let cancelled = false;
    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (!cancelled) {
            imgs[i] = img;
            if (i === 0) {
              setFirstReady(true);
              requestAnimationFrame(() => {
                drawIndex(0, true);
                // Soft media entrance after first paint
                requestAnimationFrame(() => setMediaSoftIn(true));
              });
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameSrc(i + 1);
      });
    (async () => {
      await loadOne(0);
      // Low concurrency after first frame — avoids contending with LCP/fonts (same visuals).
      const CONCURRENCY = 3;
      let next = 1;
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (!cancelled && next < FRAME_COUNT) {
          const i = next++;
          // Yield to idle when available so scroll/INP stay responsive.
          await new Promise<void>((r) => {
            if (typeof requestIdleCallback === "function") {
              requestIdleCallback(() => r(), { timeout: 400 });
            } else {
              setTimeout(r, 0);
            }
          });
          if (cancelled) return;
          await loadOne(i);
        }
      });
      await Promise.all(workers);
    })();
    return () => {
      cancelled = true;
    };
  }, [drawIndex]);

  useEffect(() => {
    if (!firstReady) return;
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = Math.max(1, el.offsetHeight - window.innerHeight);
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = scrolled / total;
        const continuous = progress * (FRAME_COUNT - 1);
        const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(continuous)));
        setScrub(continuous);
        drawIndex(idx);
        if (
          idx >= FRAME_COUNT - 1 &&
          progress >= 0.995 &&
          imagesRef.current[FRAME_COUNT - 1]?.complete &&
          !introFiredRef.current
        ) {
          introFiredRef.current = true;
          window.dispatchEvent(new Event("pm:hero-intro-done"));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawIndex, firstReady]);

  const buttonOpacity = rangeOpacity(scrub, BUTTON_FROM, FRAME_COUNT - 1, 4.5);
  const scrollHintOpacity =
    scrub < 0.35 ? 1 : Math.max(0, 1 - (scrub - 0.35) / 7.5);

  return (
    <section
      ref={sectionRef}
      className="relative w-screen max-w-[100vw]"
      style={{
        height: `${SCROLL_VH}vh`,
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-label="هیرو"
      dir="rtl"
    >
      <style>{`
        @keyframes hero-soft-float {
          0%, 100% { transform: translateY(0); opacity: 0.72; }
          50% { transform: translateY(6px); opacity: 0.95; }
        }
        @keyframes hero-media-in {
          from { opacity: 0.35; transform: scale(1.03); filter: blur(6px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .hero-scroll-hint {
          animation: hero-soft-float 2.4s ${SOFT_EASE} infinite;
        }
        .hero-media-soft {
          animation: hero-media-in 1.15s ${SOFT_EASE} both;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-scroll-hint,
          .hero-media-soft { animation: none; }
        }
      `}</style>

      <div
        ref={stageRef}
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{
          height: "100dvh",
          minHeight: "100vh",
          width: "100vw",
          backgroundColor: "#1a2228",
        }}
      >
        {!firstReady && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero/hero-poster.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center center" }}
            fetchPriority="high"
          />
        )}

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 block h-full w-full ${mediaSoftIn ? "hero-media-soft" : ""}`}
          style={{
            width: "100%",
            height: "100%",
            opacity: mediaSoftIn || !firstReady ? 1 : 0.35,
          }}
        />

        {/* Soft atmosphere: cool vignette + gentle wash (not a hard black plate) */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 85% at 50% 42%, transparent 42%, rgba(12, 22, 30, 0.22) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-transparent dark:bg-[rgba(8,14,20,0.18)]"
          aria-hidden
        />

        {/* Soft bottom blend into page — lighter than former 0.55 black bar */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-52 sm:h-60"
          style={{
            background:
              "linear-gradient(to top, rgba(248,249,250,0.55) 0%, rgba(20,28,36,0.28) 38%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] hidden h-52 dark:block sm:h-60"
          style={{
            background:
              "linear-gradient(to top, rgba(10,14,18,0.72) 0%, rgba(10,14,18,0.22) 45%, transparent 100%)",
          }}
        />

        {/* لایه متن اسکراب — وسط صفحه */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
          <div className="relative flex w-full max-w-3xl flex-col items-center justify-center text-center">
            {SLIDES.map((slide, i) => {
              const op = rangeOpacity(scrub, slide.start, slide.end);
              if (op <= 0.001) return null;
              const rising = scrub < (slide.start + slide.end) / 2;
              // Soft slide: slight drift while fading — driven by scrub, not CSS lag
              const drift = (1 - op) * (rising ? 16 : -12);
              const brandNudge =
                i === 2 && buttonOpacity > 0.05 ? -20 : 0;
              return (
                <p
                  key={i}
                  className="absolute inset-x-0 leading-relaxed text-white will-change-[opacity,transform]"
                  style={{
                    opacity: op,
                    textShadow:
                      "0 1px 2px rgba(8,16,24,0.18), 0 8px 28px rgba(8,16,24,0.28)",
                    transform: `translateY(${brandNudge + drift}px)`,
                  }}
                >
                  <TitleContent text={slide.text} />
                </p>
              );
            })}

            {/* دکمه از فریم ۴۸ — زیر متن آخر */}
            <div
              className="pointer-events-auto mt-20 flex justify-center sm:mt-24"
              style={{
                opacity: buttonOpacity,
                pointerEvents: buttonOpacity > 0.15 ? "auto" : "none",
                transform: `translateY(${8 + (1 - buttonOpacity) * 20}px)`,
              }}
            >
              <ArrowFillButton href="/محصولات" btnText="خرید آنلاین" className="pointer-events-auto" />
            </div>
          </div>
        </div>

        {/* نشانگر اسکرول — نرم‌تر و کوچک‌تر */}
        <div
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5"
          style={{
            opacity: scrollHintOpacity,
            transition: `opacity 320ms ${SOFT_EASE}`,
          }}
          aria-hidden
        >
          <span
            className="text-sm font-medium tracking-wide text-white/90 sm:text-base"
            style={{ textShadow: "0 1px 10px rgba(8,16,24,0.35)" }}
          >
            اسکرول کنید
          </span>
          <span
            className="hero-scroll-hint inline-flex items-center justify-center text-white/88"
            style={{ textShadow: "0 2px 14px rgba(8,16,24,0.3)" }}
          >
            <ChevronDown className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </section>
  );
}
