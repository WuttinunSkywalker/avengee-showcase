import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { marketplaceMessages } from "@/features/marketplace/i18n/messages"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/marketplace">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  const t = marketplaceMessages[locale]
  return {
    title: { default: `Talad | ${t.tagline}`, template: "%s | Talad" },
    description: t.hero.body,
    alternates: { languages: { en: "/en/marketplace", th: "/th/marketplace" } },
    openGraph: { siteName: "Talad", description: t.hero.body },
  }
}

/** Marks the subtree as Talad so globals.css applies its theme and fonts to the whole page. */
export default function MarketplaceAppLayout({ children }: LayoutProps<"/[lang]/marketplace">) {
  return (
    <div data-app="marketplace" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
