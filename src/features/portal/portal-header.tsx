"use client"

import Link from "next/link"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { site } from "@/config/site"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { portalMessages } from "./messages"

export function AvengeeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M9 23 16 8l7 15h-4.2L16 16.6 13.2 23Z" className="fill-primary-foreground" />
      <circle cx="16" cy="25.5" r="1.8" className="fill-signal" />
    </svg>
  )
}

export function PortalHeader() {
  const locale = useLocale()
  const t = portalMessages[locale]
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={localePath(locale, "/")}
          className="flex items-center gap-2.5 rounded-sm font-heading text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <AvengeeMark className="size-7" />
          <span translate="no">{site.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <a href="#showcases">{t.nav.work}</a>
          </Button>
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <a href="#services">{t.nav.services}</a>
          </Button>
          <LocaleSwitcher />
          <ThemeToggle label={t.nav.theme} />
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <a href="#contact">{t.nav.contact}</a>
          </Button>
        </nav>
      </div>
      {/* How far down the page you are; only where scroll timelines are supported. */}
      <span aria-hidden="true" className="scroll-progress absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
    </header>
  )
}
