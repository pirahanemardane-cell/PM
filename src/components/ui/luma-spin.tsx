import { cn } from "@/lib/utils";

/** اسپینر برند — رنگ حلقه = primary (لایت/دارک) */
export function LumaSpin({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square w-[65px]", className)} aria-hidden>
      <span className="animate-loaderAnim absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-primary" />
      <span className="animate-loaderAnim animation-delay-loader absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-primary" />
    </div>
  );
}

/** alias برای سازگاری با دمو */
export const Component = LumaSpin;
