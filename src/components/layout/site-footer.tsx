"use client";

import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Footer } from "@/components/ui/modem-animated-footer";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <Footer
      brandName="پیراهن مردانه"
      brandDescription="فروشگاه تخصصی پیراهن مردانه — رسمی، اسپرت، کروات، پاپیون و اکسسوری"
      socialLinks={[
        {
          icon: <InstagramIcon className="h-6 w-6" />,
          href: "https://instagram.com",
          label: "اینستاگرام",
        },
        {
          icon: <Mail className="h-6 w-6" />,
          href: "mailto:info@pirahanmardane.ir",
          label: "ایمیل",
        },
        {
          icon: <Phone className="h-6 w-6" />,
          href: "tel:+980000000000",
          label: "تلفن",
        },
      ]}
      navLinks={[
        { label: "محصولات", href: "/products" },
        { label: "راهنمای سایز", href: "/size-guide" },
        { label: "ارسال", href: "/shipping" },
        { label: "مرجوعی", href: "/returns" },
        { label: "حریم خصوصی", href: "/privacy" },
        { label: "تماس", href: "/contact" },
      ]}
      brandIcon={
        <Image
          src="/brand/logo-light.webp"
          alt="پیراهن مردانه"
          width={80}
          height={80}
          className="h-10 w-auto object-contain sm:h-12 md:h-16"
        />
      }
    />
  );
}
