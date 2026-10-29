import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { spa } from "../../data/spa"
import { spaMessages } from "../../i18n/messages"
import { formatMinutes } from "../../lib/time"

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = spaMessages[locale]
  return (
    <footer className="mt-auto border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-2xl" translate="no">
            {spa.name[locale]}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{spa.tagline[locale]}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">{t.footer.visit}</h2>
          <address className="text-muted-foreground not-italic">
            {spa.address.line1[locale]}
            <br />
            {spa.address.line2[locale]}
            <br />
            {spa.address.city[locale]}
          </address>
          <p className="text-muted-foreground">{t.footer.daily(formatMinutes(spa.hours.open), formatMinutes(spa.hours.close))}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">{t.footer.contact}</h2>
          <a className="text-muted-foreground hover:text-foreground" href={spa.phoneHref}>
            {spa.phone}
          </a>
          <a className="text-muted-foreground hover:text-foreground" href={`mailto:${spa.email}`}>
            {spa.email}
          </a>
          <p className="text-muted-foreground">
            LINE <span translate="no">{spa.lineId}</span>
          </p>
          <Link className="text-muted-foreground hover:text-foreground" href={localePath(locale, "/spa/admin")}>
            {t.footer.staff}
          </Link>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        © {spa.fullName[locale]}. {t.footer.rights}
      </p>
    </footer>
  )
}
