import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { klin } from "@/features/klin/data/scents"
import { klinMessages } from "@/features/klin/i18n/messages"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/klin">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  const t = klinMessages[locale]
  return {
    title: { default: `${klin.name} | ${t.tagline}`, template: `%s | ${klin.name}` },
    description: t.hero.body,
    alternates: { languages: { en: "/en/klin", th: "/th/klin" } },
    openGraph: { siteName: klin.name, description: t.hero.body },
  }
}

/** Marks the subtree as Klin so globals.css applies its theme and fonts to the whole page. */
export default function KlinLayout({ children }: LayoutProps<"/[lang]/klin">) {
  return (
    <div data-app="klin" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
