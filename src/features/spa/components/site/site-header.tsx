"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { MenuIcon } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { spa } from "../../data/spa"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatMinutes } from "../../lib/time"

export function Wordmark() {
  const { locale, t, href } = useSpaI18n()
  return (
    <Link
      href={href("/spa")}
      className="flex items-baseline gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="font-heading text-2xl leading-none" translate="no">
        {spa.name[locale]}
      </span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{t.brand.subtitle}</span>
    </Link>
  )
}

export function SiteHeader() {
  const { t, href } = useSpaI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const onBookingPage = pathname.includes("/spa/book")
  const links = [
    { href: href("/spa#treatments"), label: t.nav.treatments },
    { href: href("/spa#therapists"), label: t.nav.therapists },
    { href: href("/spa#visit"), label: t.nav.visit },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label={t.nav.main} className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <LocaleSwitcher className="mx-2" />
          {!onBookingPage && (
            <Button asChild size="lg">
              <Link href={href("/spa/book")}>{t.nav.book}</Link>
            </Button>
          )}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LocaleSwitcher />
          {!onBookingPage && (
            <Button asChild size="lg">
              <Link href={href("/spa/book")}>{t.nav.bookShort}</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label={t.nav.openMenu}>
                <MenuIcon aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl font-normal">
                  <Wordmark />
                </SheetTitle>
                <SheetDescription>{t.nav.openDaily(formatMinutes(spa.hours.open), formatMinutes(spa.hours.close))}</SheetDescription>
              </SheetHeader>
              <nav aria-label={t.nav.mobile} className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
