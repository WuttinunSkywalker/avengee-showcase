"use client"

import Link from "next/link"
import { useState } from "react"
import { MenuIcon } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { shop } from "../../data/shop"
import { shopMessages } from "../../i18n/messages"
import { formatBaht } from "../../lib/format"
import { CartDrawer } from "../cart/cart-drawer"

export function ShopWordmark() {
  const locale = useLocale()
  return (
    <Link
      href={localePath(locale, "/shop")}
      className="rounded-sm font-heading text-lg font-extrabold tracking-tight whitespace-nowrap [font-stretch:115%] focus-visible:ring-2 sm:text-xl sm:[font-stretch:125%] focus-visible:ring-ring focus-visible:outline-none"
      translate="no"
    >
      {shop.name}
    </Link>
  )
}

export function ShopHeader() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const [open, setOpen] = useState(false)
  const links = [
    { href: localePath(locale, "/shop/coffee"), label: t.nav.coffee },
    { href: localePath(locale, "/shop#farms"), label: t.nav.farms },
    { href: localePath(locale, "/shop#cafe"), label: t.nav.cafe },
  ]

  return (
    <>
      <p className="bg-foreground px-4 py-2 text-center text-xs text-background">{t.shipping(formatBaht(shop.freeShippingFrom))}</p>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <ShopWordmark />
          <nav aria-label={t.nav.main} className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Button key={link.href} variant="ghost" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <LocaleSwitcher className="ml-2" />
          </nav>
          <div className="ml-auto flex items-center md:ml-0">
            <CartDrawer />
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <LocaleSwitcher />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-lg" aria-label={t.nav.menu}>
                  <MenuIcon aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <ShopWordmark />
                  </SheetTitle>
                  <SheetDescription>{shop.tagline[locale]}</SheetDescription>
                </SheetHeader>
                <nav aria-label={t.nav.main} className="flex flex-col gap-1 px-4">
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
    </>
  )
}
