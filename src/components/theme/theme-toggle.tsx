"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button type="button" size="icon"  className="inline-flex h-9 w-9 min-h-9 min-w-9 max-h-9 max-w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background p-0 text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" variant="outline" aria-label="تم">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
