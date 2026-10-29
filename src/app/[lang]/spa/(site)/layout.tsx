import { SkipLink } from "@/components/skip-link"
import { isLocale } from "@/i18n/config"
import { SiteFooter } from "@/features/spa/components/site/site-footer"
import { SiteHeader } from "@/features/spa/components/site/site-header"

export default async function SpaSiteLayout({ children, params }: LayoutProps<"/[lang]/spa">) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return (
    <>
      <SkipLink label={locale === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
