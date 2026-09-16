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
        <div className="relative mx-auto flex min-h-[30rem] w-full max-w-7xl flex-col justify-between p-4 py-10 sm:min-h-[35rem] md:min-h-[40rem]">
          <div className="mb-12 flex w-full flex-col sm:mb-20 md:mb-0">
            <div className="flex w-full flex-col items-center">
              <div className="flex flex-1 flex-col items-center space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-3xl font-bold whitespace-nowrap">
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
                <div className="text-muted-foreground flex max-w-full flex-wrap justify-center gap-4 px-4 text-sm font-medium">
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

          <div className="mt-20 flex flex-col items-center justify-center gap-2 px-4 md:mt-24 md:flex-row md:items-center md:justify-between md:gap-1 md:px-0">
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

        {/* Large background text — English, single line */}
        <div
          className="from-foreground/20 via-foreground/10 pointer-events-none absolute bottom-40 left-1/2 max-w-[95vw] -translate-x-1/2 whitespace-nowrap bg-gradient-to-b to-transparent bg-clip-text px-4 text-center leading-none font-extrabold tracking-tighter text-transparent select-none md:bottom-32"
          style={{ fontSize: "clamp(2rem, 8vw, 7rem)" }}
        >
          {watermarkName}
        </div>

        <div className="bg-background/60 absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-3xl border-2 border-border p-3 backdrop-blur-sm duration-300 hover:border-foreground md:bottom-20">
          <div className="from-foreground to-foreground/80 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg sm:h-16 sm:w-16 md:h-24 md:w-24">
            {brandIcon}
          </div>
        </div>

        <div className="via-border absolute bottom-32 left-1/2 h-1 w-full -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent backdrop-blur-sm sm:bottom-34" />
        <div className="from-background via-background/80 to-background/40 absolute bottom-28 h-24 w-full bg-gradient-to-t blur-[1em]" />
      </footer>
    </section>
  );
}
