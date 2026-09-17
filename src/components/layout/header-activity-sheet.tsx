"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export type ActivityPanel = "cart" | "wishlist" | "compare" | "recent" | null;

const titles: Record<Exclude<ActivityPanel, null>, string> = {
  cart: "سبد خرید",
  wishlist: "علاقه‌مندی‌ها",
  compare: "مقایسه محصولات",
  recent: "آخرین بازدیدها",
};

const emptyText: Record<Exclude<ActivityPanel, null>, string> = {
  cart: "هنوز محصولی به سبد اضافه نشده است.",
  wishlist: "لیست علاقه‌مندی‌ها خالی است.",
  compare: "محصولی برای مقایسه انتخاب نشده است.",
  recent: "هنوز محصولی بازدید نشده است.",
};

type Props = {
  open: ActivityPanel;
  onOpenChange: (open: boolean) => void;
  items?: { id: string; title: string; href?: string }[];
};

export function HeaderActivitySheet({ open, onOpenChange, items = [] }: Props) {
  return (
    <Sheet
      open={!!open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <SheetContent side="left" className="w-full max-w-sm sm:max-w-md">
        {open ? (
          <>
            <SheetHeader>
              <SheetTitle>{titles[open]}</SheetTitle>
              <SheetDescription>
                سوابق مربوط به این بخش اینجاست.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-3 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {emptyText[open]}
                </p>
              ) : (
                items.map((item) => (
                  <a
                    key={item.id}
                    href={item.href ?? "#"}
                    className="hover:bg-muted rounded-lg border p-3 text-sm transition-colors"
                  >
                    {item.title}
                  </a>
                ))
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
