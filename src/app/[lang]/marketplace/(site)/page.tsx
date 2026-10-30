import { notFound } from "next/navigation"
import { Suspense } from "react"
import { isLocale } from "@/i18n/config"
import { Browse } from "@/features/marketplace/components/browse"
import { BrowseFallback } from "@/features/marketplace/components/browse-fallback"
import { DealerCards, HomeHero } from "@/features/marketplace/components/sections"

export default async function MarketplacePage({ params }: PageProps<"/[lang]/marketplace">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <>
      <HomeHero locale={lang} />
      <div id="browse" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
        <Suspense fallback={<BrowseFallback />}>
          <Browse />
        </Suspense>
      </div>
      <DealerCards locale={lang} />
    </>
  )
}
