import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  priority?: boolean;
};

export function Logo({ className, priority }: Props) {
  return (
    <Link href="/" className={className} aria-label="پیراهن مردانه">
      <Image
        src="/brand/logo-light.webp"
        alt="پیراهن مردانه"
        width={160}
        height={48}
        className="h-9 w-auto dark:hidden"
        priority={priority}
      />
      <Image
        src="/brand/logo-dark.webp"
        alt="پیراهن مردانه"
        width={160}
        height={48}
        className="hidden h-9 w-auto dark:block"
        priority={priority}
      />
    </Link>
  );
}
