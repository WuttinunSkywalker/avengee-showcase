import Link from "next/link"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { localePath, type Locale } from "@/i18n/config"
import { studio } from "../data/projects"
import { studioMessages } from "../i18n/messages"

/** Sorn Studio's mark: a roof drawn over a ground line, as on the studio's title blocks. */
export function SornMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M3 13 14 5l11 8" strokeLinejoin="round" />
      <path d="M7 11v11h14V11" />
      <path d="M2 23h24" />
      <path d="M12 23v-6h4v6" />
    </svg>
  )
}

export function StudioHeader({ locale }: { locale: Locale }) {
  const t = studioMessages[locale]
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={localePath(locale, "/studio")}
          className="flex items-center gap-2.5 rounded-sm text-lg font-medium tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SornMark className="size-7" />
          <span translate="no">{studio.name}</span>
        </Link>
        <nav aria-label={t.nav.label} className="flex items-center gap-1 sm:gap-4">
          <a href="#work" className="rounded-sm px-2 py-1.5 text-sm hover:text-leaf focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {t.nav.work}
          </a>
          <a href="#contact" className="rounded-sm px-2 py-1.5 text-sm hover:text-leaf focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {t.nav.contact}
          </a>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  )
}

export function StudioFooter({ locale }: { locale: Locale }) {
  const t = studioMessages[locale]
  return (
    <footer id="contact" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm sm:grid-cols-3 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-base font-medium">
            <SornMark className="size-6" />
            <span translate="no">{studio.name}</span>
          </p>
          <p className="text-muted-foreground">{t.tagline}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">{t.footer.visit}</p>
          {studio.address[locale].map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">{t.footer.contact}</p>
          <a className="w-fit text-muted-foreground hover:text-leaf" href={`mailto:${studio.email}`}>
            {studio.email}
          </a>
          <a className="w-fit text-muted-foreground tabular-nums hover:text-leaf" href={`tel:${studio.phone.replace(/\s/g, "")}`}>
            {studio.phone}
          </a>
          <p className="text-muted-foreground">
            {t.footer.line} {studio.line}
          </p>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        © {studio.name}. {t.footer.rights}
      </p>
    </footer>
  )
}
