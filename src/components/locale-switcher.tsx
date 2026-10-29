"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { localeLabels, locales, switchLocalePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"

function Switcher({ className }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const search = useSearchParams().toString()

  return (
    <nav aria-label="Language" className={cn("flex items-center rounded-full border border-border p-0.5 text-xs font-medium", className)}>
      {locales.map((candidate) => (
        <Link
          key={candidate}
          href={`${switchLocalePath(pathname, candidate)}${search ? `?${search}` : ""}`}
          hrefLang={candidate}
          lang={candidate}
          aria-current={candidate === locale ? "true" : undefined}
          aria-label={localeLabels[candidate].name}
          scroll={false}
          className="rounded-full px-2.5 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-[current=true]:bg-foreground aria-[current=true]:text-background"
        >
          {localeLabels[candidate].short}
        </Link>
      ))}
    </nav>
  )
}

/** EN / TH toggle that keeps the current page and query string. */
export function LocaleSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<span className={cn("h-7 w-[4.6rem] rounded-full border border-border", className)} />}>
      <Switcher className={className} />
    </Suspense>
  )
}
