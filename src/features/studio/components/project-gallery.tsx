"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { PROJECT_TYPES, projects, type Project, type ProjectType } from "../data/projects"
import { studioMessages } from "../i18n/messages"
import { DRAWING_VIEWS, ProjectDrawing, type DrawingView } from "./project-drawing"

type Filter = "all" | ProjectType

/** A project tile: its elevation on the drawing paper, then name, place, year and area. */
function ProjectTile({ project, locale, onOpen, href }: { project: Project; locale: Locale; onOpen?: () => void; href?: string }) {
  const t = studioMessages[locale]
  const body = (
    <>
      <div className="flex aspect-[16/10] items-center border border-border bg-card p-3 transition-colors duration-300 group-hover:border-foreground/60 sm:p-4">
        <ProjectDrawing project={project} view="elevation" labels={t.drawing} title="" className="pointer-events-none max-h-full" />
      </div>
      <div className="flex items-baseline justify-between gap-4 pt-3">
        <span className="text-lg font-medium tracking-tight">{project.name[locale]}</span>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{t.work.area(project.area)}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        {project.location[locale]}, {locale === "th" ? project.year + 543 : project.year}
      </span>
    </>
  )
  const className =
    "group flex w-full flex-col text-left rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
  return onOpen ? (
    <button type="button" onClick={onOpen} aria-label={t.work.open(project.name[locale])} className={className}>
      {body}
    </button>
  ) : (
    <a href={href} aria-label={t.work.open(project.name[locale])} className={className}>
      {body}
    </a>
  )
}

/** Server-rendered grid shown while the interactive gallery loads; each tile links to the project. */
export function ProjectGridFallback({ locale }: { locale: Locale }) {
  return (
    <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectTile project={project} locale={locale} href={`?project=${project.id}`} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Filterable project grid and a lightbox with each project's elevation, plan
 * and section. The open project and drawing live in the URL (?project=&view=),
 * so a link opens straight to them; arrow keys move between projects.
 */
export function ProjectGallery() {
  const locale = useLocale()
  const t = studioMessages[locale]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<Filter>("all")
  const visible = projects.filter((project) => filter === "all" || project.type === filter)
  const openId = searchParams.get("project")
  const viewParam = searchParams.get("view")
  const view: DrawingView = DRAWING_VIEWS.includes(viewParam as DrawingView) ? (viewParam as DrawingView) : "elevation"
  const open = openId ? projects.find((project) => project.id === openId) : undefined
  // Arrows move through the projects the visitor is looking at, wrapping round.
  const sequence = open && visible.includes(open) ? visible : projects
  const position = open ? sequence.indexOf(open) : -1

  function go(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    const search = next.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  const step = (delta: number) => {
    const target = sequence[(position + delta + sequence.length) % sequence.length]
    go({ project: target.id })
  }

  return (
    <div className="flex flex-col gap-8">
      <ToggleGroup
        type="single"
        variant="outline"
        value={filter}
        onValueChange={(value) => value && setFilter(value as Filter)}
        aria-label={t.work.filterLabel}
        className="flex-wrap justify-start"
      >
        {(["all", ...PROJECT_TYPES] as const).map((value) => (
          <ToggleGroupItem key={value} value={value} className="px-3">
            {t.work.filter[value]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.map((project) => (
          <li key={project.id}>
            <ProjectTile project={project} locale={locale} onOpen={() => go({ project: project.id, view: null })} />
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(isOpen) => !isOpen && go({ project: null, view: null })}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto overscroll-contain p-0 sm:max-w-5xl"
          onKeyDown={(event) => {
            if (event.target instanceof HTMLElement && event.target.closest("[role=radiogroup], [role=group]")) return
            if (event.key === "ArrowRight") step(1)
            if (event.key === "ArrowLeft") step(-1)
          }}
        >
          {open && (
            <div className="grid lg:grid-cols-[1.55fr_1fr]">
              <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-6 lg:border-r lg:border-b-0">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={view}
                  onValueChange={(value) => value && go({ view: value === "elevation" ? null : value })}
                  aria-label={t.lightbox.viewsLabel}
                  className="flex-wrap justify-start"
                >
                  {DRAWING_VIEWS.map((value) => (
                    <ToggleGroupItem key={value} value={value} className="px-3">
                      {t.lightbox.views[value]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <div className="flex aspect-[16/10] items-center border border-border bg-card p-3 sm:p-5">
                  <ProjectDrawing
                    key={`${open.id}-${view}`}
                    project={open}
                    view={view}
                    labels={t.drawing}
                    title={t.lightbox.drawingTitle(open.name[locale], t.lightbox.views[view])}
                    animate
                    className="max-h-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5 p-4 pr-12 sm:p-6 sm:pr-14">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground tabular-nums" data-testid="lightbox-counter">
                    {t.lightbox.counter(position + 1, sequence.length)}
                  </p>
                  <DialogTitle className="text-3xl font-light tracking-tight">{open.name[locale]}</DialogTitle>
                  <DialogDescription>{open.summary[locale]}</DialogDescription>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
                  <dt className="text-muted-foreground">{t.lightbox.details.location}</dt>
                  <dd>{open.location[locale]}</dd>
                  <dt className="text-muted-foreground">{t.lightbox.details.year}</dt>
                  <dd className="tabular-nums">{locale === "th" ? open.year + 543 : open.year}</dd>
                  <dt className="text-muted-foreground">{t.lightbox.details.area}</dt>
                  <dd className="tabular-nums">{t.work.area(open.area)}</dd>
                  <dt className="text-muted-foreground">{t.lightbox.details.type}</dt>
                  <dd>{t.lightbox.type[open.type]}</dd>
                </dl>
                <div className="flex flex-col gap-3 text-sm leading-relaxed">
                  {open.notes.map((note) => (
                    <p key={note.en}>{note[locale]}</p>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <Button variant="outline" size="lg" onClick={() => step(-1)} aria-label={t.lightbox.previous}>
                    <ChevronLeftIcon aria-hidden="true" />
                  </Button>
                  <p className="hidden text-center text-xs text-muted-foreground sm:block">{t.lightbox.keys}</p>
                  <Button variant="outline" size="lg" onClick={() => step(1)} aria-label={t.lightbox.next}>
                    <ChevronRightIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
