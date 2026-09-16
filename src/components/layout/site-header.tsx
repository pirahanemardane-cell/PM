import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Logo priority />
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:text-foreground text-muted-foreground">
            محصولات
          </Link>
        </nav>
      </div>
    </header>
  );
}
