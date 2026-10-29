import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/i18n/config"
import { getProject, studio } from "../data/projects"
import { studioMessages } from "../i18n/messages"
import { ProjectDrawing } from "./project-drawing"

/**
 * Text on the left; on the right, a drawing sheet with the studio's own
 * title block. The elevation draws itself in once, on load.
 */
export function StudioHero({ locale }: { locale: Locale }) {
  const t = studioMessages[locale]
  const project = getProject("ari-house")!
  const cells = [
    [t.hero.sheet.project, project.name[locale]],
    [t.hero.sheet.drawing, t.lightbox.views.elevation],
    [t.hero.sheet.scale, "1:100"],
    [t.hero.sheet.sheet, "A-201"],
  ]

  return (
    <section aria-labelledby="studio-hero-title" className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-20 lg:pb-28">
      <div className="flex flex-col gap-7">
        <p className="text-sm text-leaf">{t.tagline}</p>
        <h1 id="studio-hero-title" className="text-5xl leading-[1.02] font-light tracking-[-0.04em] sm:text-6xl lg:text-[4.75rem]">
          <Phrased text={t.hero.title} />
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{t.hero.body}</p>
        <p className="text-sm">{t.hero.record(studio.projectsCompleted, studio.founded)}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="xl">
            <a href="#work">{t.hero.primary}</a>
          </Button>
          <Button asChild size="xl" variant="outline">
            <a href="#contact">{t.hero.secondary}</a>
          </Button>
        </div>
      </div>

      <figure className="flex flex-col border border-foreground/80 bg-card" data-testid="hero-sheet">
        <div className="flex aspect-[16/10] items-center p-3 sm:p-6">
          <ProjectDrawing project={project} view="elevation" labels={t.drawing} title={t.lightbox.drawingTitle(project.name[locale], t.lightbox.views.elevation)} animate className="max-h-full" />
        </div>
        <figcaption className="grid grid-cols-2 border-t border-foreground/80 text-xs sm:grid-cols-4">
          {cells.map(([label, value], i) => (
            <div key={label} className={`flex flex-col gap-0.5 px-3 py-2 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} border-foreground/80`}>
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </figcaption>
      </figure>
    </section>
  )
}
