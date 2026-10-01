import type { ReactNode } from "react";

export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="w-full max-w-none mx-auto px-4 py-8 md:py-12" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-iranyekan-heavy text-primary">
          {title}
        </h1>
      </div>
      <div className="text-muted-foreground prose-p:leading-7 space-y-4 text-sm md:text-base">
        {children}
      </div>
    </main>
  );
}
