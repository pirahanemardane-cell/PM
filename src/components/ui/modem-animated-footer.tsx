"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

interface FooterProps {
  brandName?: string;
  watermarkName?: string;
  brandDescription?: string;
  socialLinks?: SocialLink[];
  navLinks?: FooterLink[];
  creatorName?: string;
  creatorUrl?: string;
  brandIcon?: React.ReactNode;
  className?: string;
}

export function Footer({
  brandName = "پیراهن مردانه",
  watermarkName = "PirahanMardane",
  brandDescription = "فروشگاه تخصصی پیراهن مردانه — رسمی، اسپرت، کروات، پاپیون و اکسسوری",
  socialLinks = [],
  navLinks = [],
  creatorName,
  creatorUrl,
  brandIcon,
  className,
}: FooterProps) {
  return (
    <section className={cn("relative mt-0 w-full overflow-hidden", className)}>
      <footer className="border-t bg-background relative mt-20">
        <div className="relative mx-auto flex min-h-[26rem] w-full max-w-7xl flex-col justify-between p-4 py-8 sm:min-h-[28rem] md:min-h-[30rem] md:py-10">
          <div className="mb-8 flex w-full flex-col sm:mb-10 md:mb-6">
            <div className="flex w-full flex-col items-center">
              <div className="flex flex-1 flex-col items-center space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-primary whitespace-nowrap text-6xl font-black tracking-tight">
                    {brandName}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-4xl px-4 text-center text-sm font-semibold whitespace-nowrap sm:text-base">
                  {brandDescription}
                </p>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-3 mb-8 flex gap-4">
                  {socialLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="h-6 w-6 duration-300 hover:scale-110">
                        {link.icon}
                      </div>
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {navLinks.length > 0 && (
                <div className="text-muted-foreground relative z-20 mx-auto grid max-w-3xl grid-cols-1 gap-y-2.5 px-4 pb-10 text-center text-sm font-medium md:grid-cols-5 md:gap-x-4 md:gap-y-3 md:pb-36">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      className="hover:text-foreground duration-300 hover:font-semibold"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative z-20 mt-6 flex flex-col items-center justify-center gap-2 px-4 md:mt-8 md:flex-row md:items-center md:justify-between md:gap-1 md:px-0">
            <p className="text-muted-foreground text-center text-base md:text-start">
              ©{new Date().getFullYear()} {brandName}. تمامی حقوق محفوظ است.
            </p>
            {creatorName && creatorUrl && (
              <nav className="flex gap-4">
                <Link
                  href={creatorUrl}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground text-base transition-colors duration-300 hover:font-medium"
                >
                  طراحی {creatorName}
                </Link>
              </nav>
            )}
          </div>
        </div>

        {/* Large background text */}
        <div
          className="text-primary/35 pointer-events-none pointer-events-none absolute bottom-8 left-1/2 z-0 sm:bottom-8 md:bottom-0 max-w-[95vw] -translate-x-1/2 whitespace-nowrap px-4 text-center leading-none font-extrabold tracking-tighter select-none md:bottom-0"
          style={{ fontSize: "clamp(2.75rem, 12vw, 9.5rem)" }}
        >
          {watermarkName}
        </div>

        {/* Logo frame: border kept, NO fill background on inner */}
        <div className="absolute bottom-12 left-1/2 z-10 md:bottom-10 flex -translate-x-1/2 items-center justify-center md:bottom-20">
          <div
            className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg flex h-14 w-14 items-center justify-center rounded-2xl border-2 p-2 shadow-sm sm:h-20 sm:w-20 md:h-24 md:w-24 duration-300 hover:border-primary transition-colors"
          >
            {brandIcon}
          </div>
        </div>

        <div className="via-border absolute bottom-22 left-1/2 h-1 w-full sm:bottom-24 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent backdrop-blur-sm sm:bottom-34" />
        <div className="from-background via-background/80 to-background/40 absolute bottom-28 h-24 w-full bg-gradient-to-t blur-[1em]" />
      </footer>
    </section>
  );
}
