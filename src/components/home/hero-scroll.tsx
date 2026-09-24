"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_COUNT = 70;
const SCROLL_VH = 320; // ارتفاع اسکراب — نرم‌تر، همه فریم‌ها دیده می‌شوند

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.webp`;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null),
  );
  const lastIdxRef = useRef(-1);
  const introFiredRef = useRef(false);
  const rafRef = useRef(0);
  const [firstReady, setFirstReady] = useState(false);

  const drawIndex = useCallback((idx: number, force = false) => {
    if (!force && idx === lastIdxRef.current) return;
    lastIdxRef.current = idx;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // نزدیک‌ترین فریم لود‌شده (بدون پرش خالی)
    let img = imagesRef.current[idx];
    if (!img) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[idx - d];
        const b = imagesRef.current[idx + d];
        if (a) {
          img = a;
          break;
        }
        if (b) {
          img = b;
          break;
        }
      }
    }
    if (!img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // لود: فریم ۱ فوری؛ بقیه موازی با concurrency بالا تا اسکراب گیر نکند
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
              requestAnimationFrame(() => drawIndex(0, true));
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameSrc(i + 1);
      });

    (async () => {
      await loadOne(0);
      const rest = async () => {
        const concurrency = 8;
        let next = 1;
        const workers = Array.from({ length: concurrency }, async () => {
          while (next < FRAME_COUNT) {
            const i = next++;
            await loadOne(i);
          }
        });
        await Promise.all(workers);
      };
      if ("requestIdleCallback" in window) {
        (
          window as Window & {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
          }
        ).requestIdleCallback(() => {
          void rest();
        }, { timeout: 400 });
      } else {
        setTimeout(() => {
          void rest();
        }, 40);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawIndex]);

  // اسکراب نرم با rAF — بدون setState در هر فریم
  useEffect(() => {
    if (!firstReady) return;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = sectionRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        if (total <= 0) return;

        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = scrolled / total;
        const idx = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(progress * (FRAME_COUNT - 1))),
        );

        drawIndex(idx);

        // فقط وقتی واقعاً آخرین فریم لود و نمایش داده شد
        if (
          idx >= FRAME_COUNT - 1 &&
          progress >= 0.995 &&
          imagesRef.current[FRAME_COUNT - 1] &&
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

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${SCROLL_VH}vh` }}
      aria-label="معرفی محصول"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ willChange: "contents" }}
        />
        {!firstReady && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero/hero-poster.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-16 text-center">
          <h1 className="px-4 text-3xl font-black tracking-tight text-white drop-shadow-md md:text-5xl">
            پیراهن مردانه
          </h1>
          <p className="mt-2 px-4 text-sm text-white/90 drop-shadow md:text-base">
            کیفیت، دوخت و استایل — مخصوص آقایان
          </p>
        </div>
      </div>
    </section>
  );
}
