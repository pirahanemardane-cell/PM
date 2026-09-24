"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const FRAME_COUNT = 70;
const POSTER = "/hero/hero-poster.webp";

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.jpg`;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [firstReady, setFirstReady] = useState(false);
  const lastIdxRef = useRef(-1);
  const introFiredRef = useRef(false);

  useEffect(() => {
    const imgs: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    imagesRef.current = imgs;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i + 1);
      img.onload = () => {
        imgs[i] = img;
        if (i === 0) setFirstReady(true);
      };
    }
  }, []);

  const drawIndex = useCallback((idx: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let img = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[Math.min(FRAME_COUNT - 1, idx + d)];
        const b = imagesRef.current[Math.max(0, idx - d)];
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
    if (!force && idx === lastIdxRef.current && canvas.width > 0) return;
    lastIdxRef.current = idx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    const tw = Math.floor(w * dpr);
    const th = Math.floor(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = 1.08;
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

      if (progress >= 1 && !introFiredRef.current) {
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
      <div
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{ height: "100dvh", minHeight: "100vh" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          style={{ opacity: firstReady ? 0 : 1 }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 block h-full w-full"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-4 text-center text-white">
          <p className="text-sm font-medium text-white/85 drop-shadow">پیراهن مردانه</p>
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
              className="rounded-xl border border-white/50 bg-white/10 px-7 py-3 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              شگفت‌انگیز
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/55">اسکرول کنید</p>
        </div>
      </div>
    </section>
  );
}
