import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "پیراهن مردانه",
  description: "فروشگاه تخصصی پیراهن مردانه — کیفیت بالا، قیمت مناسب",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
