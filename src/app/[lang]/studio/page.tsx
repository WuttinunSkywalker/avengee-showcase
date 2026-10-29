import { notFound } from "next/navigation"
import { Suspense } from "react"
import { SkipLink } from "@/components/skip-link"
import { isLocale } from "@/i18n/config"
import { ProjectGallery, ProjectGridFallback } from "@/features/studio/components/project-gallery"
import { StudioFooter, StudioHeader } from "@/features/studio/components/studio-chrome"
import { StudioHero } from "@/features/studio/components/studio-hero"
import { studioMessages } from "@/features/studio/i18n/messages"

export default async function StudioPage({ params }: PageProps<"/[lang]/studio">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = studioMessages[lang]

  return (
    <>
      <SkipLink label={t.skip} />
      <StudioHeader locale={lang} />
      <main id="main" className="flex flex-1 flex-col">
        <StudioHero locale={lang} />
        <section id="work" aria-labelledby="work-title" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 lg:py-28">
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 id="work-title" className="text-4xl font-light tracking-[-0.03em] sm:text-5xl">
                {t.work.title}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">{t.work.intro}</p>
            </div>
            <Suspense fallback={<ProjectGridFallback locale={lang} />}>
              <ProjectGallery />
            </Suspense>
          </div>
        </section>
      </main>
      <StudioFooter locale={lang} />
    </>
  )
}
