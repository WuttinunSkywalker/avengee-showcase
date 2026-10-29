import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isLocale, locales } from "@/i18n/config"
import { ogCards, PortalOgCard, ShopOgCard, SpaOgCard, type OgCardId } from "@/features/og/og-cards"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export function generateStaticParams() {
  return locales.flatMap((lang) => ogCards.map((app) => ({ lang, app })))
}

/** Renders one share card at exactly 1200×630 for `pnpm capture:og` to screenshot. */
export default async function OgCardPage({ params }: PageProps<"/[lang]/og/[app]">) {
  const { lang, app } = await params
  if (!isLocale(lang) || !ogCards.includes(app as OgCardId)) notFound()

  return (
    <div data-app={app === "portal" ? undefined : app} className="flex flex-1 items-start">
      <div id="og-card" className="h-[630px] w-[1200px] shrink-0 overflow-hidden">
        {app === "portal" && <PortalOgCard locale={lang} />}
        {app === "spa" && <SpaOgCard locale={lang} />}
        {app === "shop" && <ShopOgCard locale={lang} />}
      </div>
    </div>
  )
}
