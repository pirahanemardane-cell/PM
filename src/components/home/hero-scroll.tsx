"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_COUNT = 70;
const SCROLL_VH = 320;

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.webp`;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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

    // object-cover + کمی زوم تا لبه خالی نماند
    const zoom = 1.08;
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
        await Promise.all(
          Array.from({ length: concurrency }, async () => {
            while (next < FRAME_COUNT) {
              const i = next++;
              await loadOne(i);
            }
          }),
        );
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
        const idx = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(progress * (FRAME_COUNT - 1))),
        );
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
      <div
        ref={stageRef}
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{
          height: "100dvh",
          minHeight: "100vh",
          width: "100vw",
          backgroundColor: "#111",
        }}
      >
        {/* پوستر تا فریم ۱ آماده شود — cover کامل */}
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
          className="absolute inset-0 block h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />

        {/* گرادیان پایین برای خوانایی متن */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
          }}
        />

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
