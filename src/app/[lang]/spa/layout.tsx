import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { spa } from "@/features/spa/data/spa"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/spa">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return {
    title: {
      default: locale === "th" ? `${spa.name.th} | นวดไทยย่านอารีย์` : `${spa.name.en} | Thai massage in Ari, Bangkok`,
      template: `%s | ${spa.name[locale]}`,
    },
    description: spa.tagline[locale],
    openGraph: {
      siteName: spa.fullName[locale],
      description: spa.tagline[locale],
      images: [{ url: `/og/spa-${locale}.png`, width: 1200, height: 630, alt: spa.fullName[locale] }],
    },
    twitter: { card: "summary_large_image", images: [`/og/spa-${locale}.png`] },
    alternates: { languages: { en: "/en/spa", th: "/th/spa" } },
  }
}

/** Marks the subtree as the spa app so globals.css applies its theme and fonts to the whole page. */
export default function SpaAppLayout({ children }: LayoutProps<"/[lang]/spa">) {
  return (
    <div data-app="spa" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
