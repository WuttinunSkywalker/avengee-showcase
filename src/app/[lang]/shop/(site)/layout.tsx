import { SkipLink } from "@/components/skip-link"
import { isLocale } from "@/i18n/config"
import { ShopHeader } from "@/features/shop/components/site/shop-header"
import { ShopFooter } from "@/features/shop/components/site/home-sections"

export default async function ShopSiteLayout({ children, params }: LayoutProps<"/[lang]/shop">) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return (
    <>
      <SkipLink label={locale === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <ShopHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <ShopFooter locale={locale} />
    </>
  )
}
