import { SkipLink } from "@/components/skip-link"
import { isLocale } from "@/i18n/config"
import { MarketplaceHeader } from "@/features/marketplace/components/marketplace-header"
import { MarketplaceFooter } from "@/features/marketplace/components/sections"
import { marketplaceMessages } from "@/features/marketplace/i18n/messages"

export default async function MarketplaceSiteLayout({ children, params }: LayoutProps<"/[lang]/marketplace">) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return (
    <>
      <SkipLink label={marketplaceMessages[locale].skip} />
      <MarketplaceHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  )
}
