"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 320;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="رفتن به بالای صفحه"
      title="بالای صفحه"
      className={cn(
        "fixed bottom-6 right-6 z-[90] flex h-12 w-12 items-center justify-center",
        "rounded-xl bg-secondary text-secondary-foreground shadow-lg",
        "border-2 border-white dark:border-[#212529]",
        "transition-all duration-300 ease-out",
        "hover:bg-secondary/90 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-3 opacity-0 pointer-events-none",
      )}
    >
      <ChevronUp className="h-6 w-6" strokeWidth={2.25} />
    </button>
  );
}
