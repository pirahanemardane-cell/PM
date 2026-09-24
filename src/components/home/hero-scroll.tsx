"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const FRAME_COUNT = 70;
const VIDEO_SRC = "/hero/hero.mp4";
const POSTER = "/hero/hero-poster.webp";

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.jpg`;
}

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const imgs: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    let done = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i + 1);
      img.onload = () => {
        imgs[i] = img;
        done++;
        if (done === 1) setFramesReady(true);
      };
    }
    imagesRef.current = imgs;
  }, [isMobile]);

  const drawFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.floor(progress * (FRAME_COUNT - 1)))
    );
    const img = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 2 || h < 2) return;
    const tw = Math.floor(w * dpr);
    const th = Math.floor(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw: number, dh: number, dx: number, dy: number;
    if (ir > cr) {
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
      dy = 0;
    } else {
      dw = w;
      dh = w / ir;
      dx = 0;
      dy = (h - dh) / 2;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  const scrubVideo = useCallback((progress: number) => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration;
    if (!dur || !Number.isFinite(dur) || dur < 0.1) return;
    const t = Math.min(dur - 0.04, Math.max(0, progress * (dur - 0.04)));
    if (Math.abs(v.currentTime - t) > 0.03) {
      try {
        v.currentTime = t;
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const tick = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = scrolled / total;
      progressRef.current = progress;
      if (isMobile) drawFrame(progress);
      else scrubVideo(progress);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [isMobile, framesReady, drawFrame, scrubVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isMobile) return;
    const onMeta = () => scrubVideo(progressRef.current);
    v.addEventListener("loadedmetadata", onMeta);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [isMobile, scrubVideo]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[300vh] w-screen max-w-[100vw]"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-label="هیرو"
      dir="rtl"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black">
        {!isMobile ? (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER}
            muted
            playsInline
            preload="auto"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POSTER}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: framesReady ? 0 : 1 }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-4 text-center text-white">
          <p className="text-sm font-medium text-white/80">پیراهن مردانه</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            استایل رسمی، حس اطمینان
          </h1>
          <p className="max-w-lg text-sm text-white/85 sm:text-base">
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
          <p className="mt-6 text-xs text-white/50">اسکرول کنید</p>
        </div>
      </div>
    </section>
  );
}
