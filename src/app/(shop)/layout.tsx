import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1"><div className="w-full max-w-none">
        
        <AppBreadcrumb />
        {children}</div></div>
      <SiteFooter />
    </div>
  );
}
