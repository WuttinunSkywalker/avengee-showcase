import type { Metadata } from "next"
import { ShowcaseReturn } from "@/components/showcase-return"
import { isLocale } from "@/i18n/config"
import { studio } from "@/features/studio/data/projects"
import { studioMessages } from "@/features/studio/i18n/messages"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/studio">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  const t = studioMessages[locale]
  return {
    title: { default: `${studio.name} | ${t.tagline}`, template: `%s | ${studio.name}` },
    description: t.hero.body,
    alternates: { languages: { en: "/en/studio", th: "/th/studio" } },
    openGraph: { siteName: studio.name, description: t.hero.body },
  }
}

/** Marks the subtree as Sorn Studio so globals.css applies its theme and fonts to the whole page. */
export default function StudioAppLayout({ children }: LayoutProps<"/[lang]/studio">) {
  return (
    <div data-app="studio" className="flex min-h-full flex-1 flex-col">
      {children}
      <ShowcaseReturn />
    </div>
  )
}
