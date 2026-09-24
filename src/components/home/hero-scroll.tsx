"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const FRAME_COUNT = 70;
const POSTER = "/hero/hero-poster.webp";

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.webp`;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [firstReady, setFirstReady] = useState(false);
  const [frameUrl, setFrameUrl] = useState(POSTER);
  const lastIdxRef = useRef(-1);
  const introFiredRef = useRef(false);

  useEffect(() => {
    const imgs: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    imagesRef.current = imgs;

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          imgs[i] = img;
          if (i === 0) {
            setFirstReady(true);
            setFrameUrl(frameSrc(1));
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameSrc(i + 1);
      });

    // فریم اول فوری؛ بقیه در idle تا TTI خراب نشود
    (async () => {
      await loadOne(0);
      const rest = async () => {
        const batch = 4;
        for (let i = 1; i < FRAME_COUNT; i += batch) {
          const slice: Promise<void>[] = [];
          for (let j = i; j < Math.min(FRAME_COUNT, i + batch); j++) {
            slice.push(loadOne(j));
          }
          await Promise.all(slice);
        }
      };
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
          () => { void rest(); }
        );
      } else {
        setTimeout(() => { void rest(); }, 50);
      }
    })();
  }, []);

  const drawIndex = useCallback((idx: number, force = false) => {
    const safe = Math.min(FRAME_COUNT - 1, Math.max(0, idx));
    setFrameUrl(frameSrc(safe + 1));

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let img = imagesRef.current[safe];
    if (!img?.complete || !img.naturalWidth) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[Math.min(FRAME_COUNT - 1, safe + d)];
        const b = imagesRef.current[Math.max(0, safe - d)];
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
    if (!force && safe === lastIdxRef.current && canvas.width > 0) return;
    lastIdxRef.current = safe;

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

    // cover واقعی + کمی زوم تا لبه خالی نماند
    const scale = 1.12;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw: number, dh: number;
    if (ir > cr) {
      dh = h * scale;
      dw = dh * ir;
    } else {
      dw = w * scale;
      dh = dw / ir;
    }
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, section.offsetHeight - window.innerHeight);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = scrolled / total;
      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
      );
      drawIndex(idx);

      if (idx >= FRAME_COUNT - 1 && progress >= 0.99 && !introFiredRef.current) {
        introFiredRef.current = true;
        try {
          sessionStorage.setItem("pm-hero-intro-done", "1");
        } catch {}
        window.dispatchEvent(new Event("pm:hero-intro-done"));
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      lastIdxRef.current = -1;
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize);
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [drawIndex, firstReady]);

  useEffect(() => {
    if (!firstReady) return;
    lastIdxRef.current = -1;
    drawIndex(0, true);
  }, [firstReady, drawIndex]);

  return (
    <section
      ref={sectionRef}
      className="relative w-screen max-w-[100vw]"
      style={{
        height: "300vh",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-label="هیرو"
      dir="rtl"
    >
      {/* لایه چسبان = دقیقاً یک صفحه، بدون پس‌زمینه رنگی */}
      <div
        ref={stageRef}
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{
          height: "100dvh",
          minHeight: "100vh",
          width: "100vw",
        }}
      >
        {/* لایه پایه: همیشه object-cover — اگر canvas دیر شود هم خالی نیست */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 block h-full w-full"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-4 text-center text-white">
          <p className="text-sm font-medium text-white/90 drop-shadow">پیراهن مردانه</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight drop-shadow-md sm:text-4xl md:text-5xl lg:text-6xl">
            استایل رسمی، حس اطمینان
          </h1>
          <p className="max-w-lg text-sm text-white/90 drop-shadow sm:text-base">
            مجموعه‌ای از پیراهن‌های رسمی و کژوال با کیفیت دوخت و پارچه منتخب
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-7 py-3 text-sm font-medium"
            >
              مشاهده فروشگاه
            </Link>
            <Link
              href="/products?featured=1"
              className="rounded-xl border border-white/70 bg-black/40 px-7 py-3 text-sm font-medium text-white backdrop-blur hover:bg-black/55"
            >
              شگفت‌انگیز
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/60">اسکرول کنید</p>
        </div>
      </div>
    </section>
  );
}
