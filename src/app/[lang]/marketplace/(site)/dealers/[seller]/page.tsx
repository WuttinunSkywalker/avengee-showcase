import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { isLocale, locales } from "@/i18n/config"
import { Browse } from "@/features/marketplace/components/browse"
import { BrowseFallback } from "@/features/marketplace/components/browse-fallback"
import { SellerProfile } from "@/features/marketplace/components/sections"
import { getSeller, sellers } from "@/features/marketplace/data/sellers"

export function generateStaticParams() {
  return locales.flatMap((lang) => sellers.map((seller) => ({ lang, seller: seller.id })))
}

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/dealers/[seller]">): Promise<Metadata> {
  const { lang, seller: id } = await params
  const seller = getSeller(id)
  if (!seller || !isLocale(lang)) return {}
  return {
    title: seller.name[lang],
    description: seller.about[lang],
    alternates: { languages: { en: `/en/marketplace/dealers/${id}`, th: `/th/marketplace/dealers/${id}` } },
  }
}

// Every dealer is pre-generated; reading params up front lets unknown ids 404 properly.
export const instant = false

export default async function DealerPage({ params }: PageProps<"/[lang]/marketplace/dealers/[seller]">) {
  const { lang, seller: id } = await params
  const seller = getSeller(id)
  if (!isLocale(lang) || !seller) notFound()
  return (
    <>
      <SellerProfile seller={seller} locale={lang} />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={<BrowseFallback />}>
          <Browse seller={seller.id} />
        </Suspense>
      </div>
    </>
  )
}
