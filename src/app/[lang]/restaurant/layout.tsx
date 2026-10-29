import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { restaurant } from "@/features/restaurant/data/menu"
import { restaurantMessages } from "@/features/restaurant/i18n/messages"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/restaurant">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  const t = restaurantMessages[locale]
  const name = locale === "th" ? `${restaurant.nameTh} ${restaurant.name}` : restaurant.name
  return {
    title: { default: `${name} | ${t.tagline}`, template: `%s | ${restaurant.name}` },
    description: t.landing.body,
    alternates: { languages: { en: "/en/restaurant", th: "/th/restaurant" } },
    openGraph: {
      siteName: restaurant.name,
      description: t.landing.body,
      images: [{ url: `/og/restaurant-${locale}.png`, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: "summary_large_image", images: [`/og/restaurant-${locale}.png`] },
  }
}

/** Marks the subtree as Krua Yai so globals.css applies its theme and fonts to the whole page. */
export default function RestaurantAppLayout({ children }: LayoutProps<"/[lang]/restaurant">) {
  return (
    <div data-app="restaurant" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
