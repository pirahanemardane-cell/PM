import type { ReactNode } from "react";

export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12" dir="rtl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h1>
      <div className="text-muted-foreground prose-p:leading-7 space-y-4 text-sm md:text-base">
        {children}
      </div>
    </main>
  );
}
