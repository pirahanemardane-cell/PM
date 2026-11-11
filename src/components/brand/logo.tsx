import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "footer";
};

const sizes = {
  sm: { width: 100, height: 30, className: "h-7 w-auto max-h-7 max-w-[6.5rem]" },
  md: { width: 140, height: 42, className: "h-8 w-auto max-h-8 max-w-[8rem]" },
  lg: { width: 160, height: 48, className: "h-9 w-auto max-h-9 max-w-[9rem]" },
  /* Square mark sized to the footer glass plate — must not spill past rounded bounds */
  footer: {
    width: 88,
    height: 88,
    className: "h-full w-full max-h-full max-w-full object-contain object-center",
  },
};

export function Logo({ className, priority, size = "md" }: Props) {
  const s = sizes[size];
  const fillPlate = size === "footer";

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center",
        fillPlate && "h-full w-full min-h-0 min-w-0 justify-center overflow-hidden",
        className,
      )}
      aria-label="پیراهن مردانه"
    >
      <Image
        src="/brand/logo-light-transparent.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={cn(s.className, "dark:hidden")}
        priority={priority}
      />
      <Image
        src="/brand/logo-dark-transparent.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={cn(s.className, "hidden dark:block")}
        priority={priority}
      />
    </Link>
  );
}
