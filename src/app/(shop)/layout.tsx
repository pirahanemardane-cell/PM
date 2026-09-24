import { ScrollToTop } from "@/components/scroll-to-top";
import { NotificationsProvider } from "@/lib/notifications/notifications-provider";
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
        <NotificationsProvider><ScrollToTop />
        {children}</NotificationsProvider></div></div>
      <SiteFooter />
    </div>
  );
}
