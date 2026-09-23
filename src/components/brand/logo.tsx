import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "footer";
};

const sizes = {
  sm: { width: 120, height: 36, className: "h-8 w-auto" },
  md: { width: 160, height: 48, className: "h-9 w-auto" },
  lg: { width: 200, height: 60, className: "h-9 w-auto max-h-9" },
  footer: { width: 240, height: 72, className: "h-14 w-auto max-h-14 max-w-[11rem] sm:max-w-[14rem]" },
};

/**
 * Transparent logos only:
 * - light: Pirrahanmardane-logo-T.webp
 * - dark:  blue_t_bg.webp
 */
export function Logo({ className, priority, size = "md" }: Props) {
  const s = sizes[size];

  return (
    <Link href="/" className={className} aria-label="پیراهن مردانه">
      <Image
        src="/brand/logo-light-transparent.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={`${s.className} dark:hidden`}
        priority={priority}
      />
      <Image
        src="/brand/logo-dark-transparent.webp"
        alt="پیراهن مردانه"
        width={s.width}
        height={s.height}
        className={`${s.className} hidden dark:block`}
        priority={priority}
      />
    </Link>
  );
}
