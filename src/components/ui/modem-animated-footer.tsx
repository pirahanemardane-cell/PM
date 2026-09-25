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
      <footer className="border-t bg-background relative mt-20 overflow-hidden">
        <div className="relative mx-auto flex min-h-[22rem] w-full max-w-7xl flex-col justify-between p-4 py-8 sm:min-h-[26rem] md:min-h-[30rem] md:py-10">
          <div className="mb-8 flex w-full flex-col sm:mb-10 md:mb-6">
            <div className="flex w-full flex-col items-center">
              <div className="flex w-full max-w-full flex-1 flex-col items-center space-y-2 px-2">
                <div className="flex max-w-full items-center justify-center gap-2">
                  <span className="text-primary text-center text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                    {brandName}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-xl px-2 text-center text-xs font-semibold leading-relaxed sm:max-w-2xl sm:text-sm md:text-base">
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
                <div className="text-muted-foreground relative z-20 mx-auto grid w-full max-w-4xl grid-cols-2 gap-x-2 gap-y-2.5 px-4 pb-10 text-center text-xs font-medium sm:grid-cols-4 sm:text-sm md:flex md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-0 md:pb-36 md:text-sm">
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
        </div>

        <div
          className="text-primary/35 pointer-events-none absolute bottom-6 left-1/2 z-0 w-[min(100%,100vw)] max-w-full -translate-x-1/2 overflow-hidden px-2 text-center leading-none font-extrabold tracking-tighter select-none sm:bottom-8 md:bottom-0"
          style={{
            fontSize: "clamp(1.35rem, 7.5vw, 7.5rem)",
            whiteSpace: "nowrap",
          }}
          aria-hidden
        >
          {watermarkName}
        </div>

        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center sm:bottom-12 md:bottom-20">
          <div className="border-border/60 bg-background/70 backdrop-blur-md flex h-12 w-12 items-center justify-center rounded-2xl border p-1.5 shadow-sm transition-colors duration-300 hover:border-primary supports-[backdrop-filter]:bg-background/60 sm:h-16 sm:w-16 sm:p-2 md:h-24 md:w-24">
            {brandIcon}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-18 left-1/2 h-px w-[min(100%,42rem)] -translate-x-1/2 bg-gradient-to-r from-transparent from-0% via-primary/70 via-50% to-transparent to-100% sm:bottom-22 md:bottom-34" />
        <div className="from-background via-background/80 to-background/40 absolute bottom-24 h-20 w-full bg-gradient-to-t blur-[1em] sm:bottom-28 sm:h-24" />
      </footer>
    </section>
  );
}
