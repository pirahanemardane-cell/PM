import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { AppToaster } from "@/components/ui/app-toaster";
import { RealtimeBridge } from "@/components/providers/realtime-bridge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pirahanmardane.ir";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "پیراهن مردانه | فروشگاه تخصصی پیراهن مردانه",
    template: "%s | پیراهن مردانه",
  },
  description:
    "فروشگاه تخصصی پیراهن مردانه — پیراهن رسمی، اسپرت، کروات، پاپیون و اکسسوری مردانه",
  applicationName: "پیراهن مردانه",
  authors: [{ name: "پیراهن مردانه" }],
  generator: "Next.js",
  keywords: [
    "پیراهن مردانه",
    "پیراهن رسمی",
    "پیراهن اسپرت",
    "کروات",
    "پاپیون",
    "دکمه سردست",
  ],
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: siteUrl,
    siteName: "پیراهن مردانه",
    title: "پیراهن مردانه | فروشگاه تخصصی پیراهن مردانه",
    description:
      "فروشگاه تخصصی پیراهن مردانه — پیراهن رسمی، اسپرت، کروات، پاپیون و اکسسوری",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "پیراهن مردانه",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "پیراهن مردانه | فروشگاه تخصصی پیراهن مردانه",
    description:
      "فروشگاه تخصصی پیراهن مردانه — پیراهن رسمی، اسپرت، کروات، پاپیون و اکسسوری",
    images: ["/og-image.webp"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="pm-theme"
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
                  <RealtimeBridge />
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
