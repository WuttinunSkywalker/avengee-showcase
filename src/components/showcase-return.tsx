"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { LayoutGridIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { site } from "@/config/site"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"

const labels = { en: `All ${site.name} showcases`, th: `ดูผลงานทั้งหมดของ ${site.name}` }

/**
 * A small, quiet button in the corner of every app that leads back to the
 * showcase portal. It slides away while the visitor scrolls down (so it never
 * sits on top of content they're reading) and returns when they scroll up.
 *
 * Admin screens have a sidebar footer in that corner, so there the shell
 * renders it `inline` in its top bar and the floating one stays out of the way.
 */
export function ShowcaseReturn({ inline = false }: { inline?: boolean }) {
  const locale = useLocale()
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        if (Math.abs(delta) > 6) setHidden(delta > 0 && y > 120)
        lastY.current = y
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  if (!inline && /\/admin(\/|$)/.test(pathname)) return null

  if (inline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={localePath(locale, "/")}
            aria-label={labels[locale]}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <LayoutGridIcon className="size-4" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom">{labels[locale]}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={localePath(locale, "/")}
          aria-label={labels[locale]}
          data-hidden={hidden || undefined}
          className={cn(
            "fixed bottom-4 left-4 z-30 inline-flex size-10 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-md backdrop-blur transition-[translate,opacity] duration-200 hover:text-foreground focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none print:hidden max-lg:bottom-24",
            hidden && "pointer-events-none translate-y-24 opacity-0",
          )}
        >
          <LayoutGridIcon className="size-4" aria-hidden="true" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{labels[locale]}</TooltipContent>
    </Tooltip>
  )
}
