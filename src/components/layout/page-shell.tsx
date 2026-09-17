"use client";

import { AppBreadcrumb, type Crumb } from "@/components/ui/app-breadcrumb";

export function PageShell({
  crumbs,
  children,
}: {
  crumbs?: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" dir="rtl">
      {crumbs?.length ? <AppBreadcrumb items={crumbs} /> : null}
      <div className="bg-background">{children}</div>
    </div>
  );
}
