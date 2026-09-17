import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { HeaderSearchStrip } from "@/components/layout/header-search-strip";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1"><div className="w-full max-w-none"><AppBreadcrumb />
        <HeaderSearchStrip />
        {children}</div></div>
      <SiteFooter />
    </div>
  );
}
