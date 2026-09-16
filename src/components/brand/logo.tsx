import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  priority?: boolean;
  /** header / footer / mobile */
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 120, height: 36, className: "h-8 w-auto" },
  md: { width: 160, height: 48, className: "h-9 w-auto" },
  lg: { width: 200, height: 60, className: "h-12 w-auto sm:h-14 md:h-16" },
};

export function Logo({ className, priority, size = "md" }: Props) {
  const s = sizes[size];

  return (
    <Link href="/" className={className} aria-label="پیراهن مردانه">
      {/* transparent light */}
      <Image
        src="/brand/logo-light.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={`${s.className} dark:hidden`}
        priority={priority}
      />
      {/* transparent dark */}
      <Image
        src="/brand/logo-dark.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={`${s.className} hidden dark:block`}
        priority={priority}
      />
    </Link>
  );
}
