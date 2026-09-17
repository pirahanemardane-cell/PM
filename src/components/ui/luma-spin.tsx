"use client";

export function LumaSpin({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square w-[65px] ${className}`}
      aria-label="در حال بارگذاری"
      role="status"
    >
      <span className="animate-luma-spin absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100" />
      <span className="animate-luma-spin animation-delay-luma absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100" />
    </div>
  );
}

/** alias مطابق دمو */
export const Component = LumaSpin;
