"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FRAME_COUNT = 70;
const VIDEO_SRC = "/hero/hero.mp4";
const POSTER = "/hero/hero-poster.webp";

function frameSrc(i: number) {
  return `/hero/frames/frame-${String(i).padStart(3, "0")}.jpg`;
}

export function HeroScroll({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => {
        loaded++;
        if (loaded >= Math.min(8, FRAME_COUNT)) setReady(true);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, [isMobile]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = scrolled / total;

        if (isMobile) {
          const canvas = canvasRef.current;
          const imgs = imagesRef.current;
          if (!canvas || imgs.length === 0) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const idx = Math.min(
            FRAME_COUNT - 1,
            Math.floor(progress * (FRAME_COUNT - 1))
          );
          const img = imgs[idx];
          if (!img?.complete || !img.naturalWidth) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (w < 1 || h < 1) return;
          if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          const ir = img.naturalWidth / img.naturalHeight;
          const cr = w / h;
          let dw = w;
          let dh = h;
          let dx = 0;
          let dy = 0;
          if (ir > cr) {
            dh = h;
            dw = h * ir;
            dx = (w - dw) / 2;
          } else {
            dw = w;
            dh = w / ir;
            dy = (h - dh) / 2;
          }
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          const v = videoRef.current;
          if (!v || !v.duration || !Number.isFinite(v.duration)) return;
          const t = progress * Math.max(0, v.duration - 0.05);
          if (Math.abs(v.currentTime - t) > 0.05) {
            try {
              v.currentTime = t;
            } catch {
              /* seek race */
            }
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [isMobile, ready]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative h-[280vh] bg-[#F8F9FA] dark:bg-[#212529]",
        className
      )}
      dir="rtl"
      aria-label="هیرو"
    >
      <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden">
        {!isMobile ? (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedMetadata={() => setReady(true)}
          />
        ) : (
          <>
            {/* پوستر تا فریم‌ها لود شوند */}
            {!ready ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={POSTER}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/15" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center text-white">
          <p className="text-sm font-medium tracking-wide text-white/80">
            پیراهن مردانه
          </p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            استایل رسمی، حس اطمینان
          </h1>
          <p className="max-w-md text-sm text-white/85 sm:text-base">
            مجموعه‌ای از پیراهن‌های رسمی و کژوال با کیفیت دوخت و پارچه منتخب
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-2.5 text-sm font-medium"
            >
              مشاهده فروشگاه
            </Link>
            <Link
              href="/products?featured=1"
              className="rounded-xl border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              شگفت‌انگیز
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
