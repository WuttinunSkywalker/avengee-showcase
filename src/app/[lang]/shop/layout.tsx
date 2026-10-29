import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { shop } from "@/features/shop/data/shop"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/shop">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return {
    title: {
      default: locale === "th" ? `${shop.name} | กาแฟคั่วสดจากเชียงใหม่` : `${shop.name} | Specialty coffee roasted in Chiang Mai`,
      template: `%s | ${shop.name}`,
    },
    description: shop.tagline[locale],
    alternates: { languages: { en: "/en/shop", th: "/th/shop" } },
    openGraph: {
      siteName: shop.name,
      description: shop.tagline[locale],
      images: [{ url: `/og/shop-${locale}.png`, width: 1200, height: 630, alt: shop.name }],
    },
    twitter: { card: "summary_large_image", images: [`/og/shop-${locale}.png`] },
  }
}

/** Marks the subtree as the shop app so globals.css applies its theme and fonts to the whole page. */
export default function ShopAppLayout({ children }: LayoutProps<"/[lang]/shop">) {
  return (
    <div data-app="shop" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
