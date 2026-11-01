"use client"

import { AnimatePresence, motion } from "motion/react"
import { ShoppingBagIcon } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/i18n/locale-provider"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { getScent, klin } from "../data/scents"
import { klinMessages } from "../i18n/messages"
import { formatPrice } from "../lib/story"
import { bottleCount, useBagStore } from "../store/bag-store"

export function KlinHeader() {
  const locale = useLocale()
  const t = klinMessages[locale]
  const hydrated = usePersistHydrated(useBagStore.persist)
  useStorageSync(useBagStore.persist)
  const lines = useBagStore((state) => state.lines)
  const count = hydrated ? bottleCount(lines) : 0
  const subtotal = lines.reduce((sum, line) => sum + (getScent(line.scentId)?.sizes.find((size) => size.ml === line.ml)?.price ?? 0) * line.quantity, 0)

  return (
    <header className="fixed inset-x-0 top-0 z-40 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-28 before:bg-gradient-to-b before:from-[var(--klin-backdrop,#1b282d)] before:via-[var(--klin-backdrop,#1b282d)]/80 before:to-transparent">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" className="rounded-sm font-heading text-3xl leading-none tracking-[0.04em] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none" translate="no">
          {klin.name}
        </a>
        <nav aria-label={t.nav.main} className="flex items-center gap-1 sm:gap-2">
          <a href="#monsoon" className="hidden rounded-full px-3 py-2 text-sm hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex">
            {t.nav.scents}
          </a>
          <a href="#atelier" className="hidden rounded-full px-3 py-2 text-sm hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex">
            {t.nav.atelier}
          </a>
          <LocaleSwitcher className="mx-1" />
          <Popover>
            <PopoverTrigger
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={t.nav.bag(count)}
              data-testid="klin-bag"
            >
              <ShoppingBagIcon className="size-5" aria-hidden="true" />
              {/* The count pops each time a bottle goes in */}
              <AnimatePresence initial={false}>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.2, y: -6 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.2, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[0.7rem] font-semibold text-background tabular-nums"
                    aria-hidden="true"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80" data-lenis-prevent>
              <p className="font-heading text-xl">{t.nav.bagTitle}</p>
              {count === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{t.nav.bagEmpty}</p>
              ) : (
                <>
                  <ul className="mt-3 flex flex-col gap-2 text-sm">
                    {lines.map((line) => {
                      const scent = getScent(line.scentId)
                      const price = scent?.sizes.find((size) => size.ml === line.ml)?.price ?? 0
                      return (
                        <li key={`${line.scentId}-${line.ml}-${line.engraving ?? ""}`} className="flex justify-between gap-3">
                          <span>
                            {t.nav.line(scent?.name[locale] ?? "", line.ml, line.quantity)}
                            {line.engraving && <span className="block text-xs text-muted-foreground">{t.nav.engraved(line.engraving)}</span>}
                          </span>
                          <span className="tabular-nums">{formatPrice(price * line.quantity)}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-medium">
                    <span>{t.nav.subtotal}</span>
                    <span className="tabular-nums" data-testid="klin-subtotal">
                      {formatPrice(subtotal)}
                    </span>
                  </p>
                </>
              )}
            </PopoverContent>
          </Popover>
        </nav>
      </div>
    </header>
  )
}
