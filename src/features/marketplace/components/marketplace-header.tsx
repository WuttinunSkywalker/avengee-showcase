"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { marketplaceMessages } from "../i18n/messages"
import { emptyQuery, queryString } from "../lib/search"

/** The wordmark: the name in the display face with a small gilt tag, the site's one ornament. */
export function TaladWordmark({ className }: { className?: string }) {
  const locale = useLocale()
  return (
    <Link
      href={localePath(locale, "/marketplace")}
      className={`inline-flex items-center gap-2 rounded-sm font-heading text-2xl leading-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className ?? ""}`}
      translate="no"
    >
      <svg viewBox="0 0 20 28" className="h-6 w-auto text-gilt" aria-hidden="true">
        <path d="M10 1 19 9v18H1V9Z" fill="currentColor" />
        <circle cx="10" cy="9" r="2.4" className="fill-background" />
      </svg>
      Talad
    </Link>
  )
}

/** The header field's id, so "Clear all" on the results can empty it too. */
export const SEARCH_INPUT_ID = "talad-search"

/**
 * Works as a plain GET form before hydration; after that it searches without
 * a page load. It fills itself from the URL after mount rather than reading
 * search params while rendering: this header sits in the layout, and reading
 * them there would make every page stream before it can answer 404.
 */
function SearchForm({ locale }: { locale: Locale }) {
  const t = marketplaceMessages[locale].nav
  const router = useRouter()
  const pathname = usePathname()
  const input = useRef<HTMLInputElement>(null)
  const action = localePath(locale, "/marketplace")

  useEffect(() => {
    if (input.current) input.current.value = new URLSearchParams(window.location.search).get("q") ?? ""
  }, [pathname])

  return (
    <form
      action={action}
      role="search"
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault()
        const q = String(new FormData(event.currentTarget).get("q") ?? "")
        router.push(`${action}${queryString({ ...emptyQuery, q })}`)
      }}
    >
      <InputGroup className="h-10 bg-card">
        <InputGroupInput
          ref={input}
          id={SEARCH_INPUT_ID}
          type="search"
          name="q"
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
          autoComplete="off"
          spellCheck={false}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" size="icon-sm" aria-label={t.submit}>
            <SearchIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

export function MarketplaceHeader() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const search = <SearchForm locale={locale} />
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:h-16 md:flex-row md:items-center md:gap-6 md:py-0">
        <div className="flex items-center justify-between gap-4">
          <TaladWordmark />
          <div className="flex items-center gap-1 md:hidden">
            <LocaleSwitcher />
            <ThemeToggle label={locale === "th" ? "สลับโหมดมืด" : "Toggle dark mode"} />
          </div>
        </div>
        <div className="md:mx-auto md:w-full md:max-w-xl">{search}</div>
        <nav aria-label={t.nav.main} className="hidden items-center gap-1 md:flex">
          <Link
            href={`${localePath(locale, "/marketplace")}#dealers`}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t.nav.dealers}
          </Link>
          <LocaleSwitcher className="ml-1" />
          <ThemeToggle label={locale === "th" ? "สลับโหมดมืด" : "Toggle dark mode"} />
        </nav>
      </div>
    </header>
  )
}
