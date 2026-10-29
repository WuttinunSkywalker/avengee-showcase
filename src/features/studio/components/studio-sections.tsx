import type { CSSProperties } from "react"
import { HammerIcon, HouseIcon, SofaIcon, StoreIcon, type LucideIcon } from "lucide-react"
import { InView } from "@/components/in-view"
import type { Locale } from "@/i18n/config"
import { SERVICES, STAGES, WEEKS_TO_PERMIT, type Service } from "../data/projects"
import { studioMessages } from "../i18n/messages"

const serviceIcons: Record<Service, LucideIcon> = { houses: HouseIcon, renovation: HammerIcon, hospitality: StoreIcon, interiors: SofaIcon }

/** A dimension line, as on the studio's drawings: a rule with ticks at both ends. */
function DimensionRule() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className="h-2.5 w-full text-foreground">
      <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="0.5" y1="0" x2="0.5" y2="10" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="99.5" y1="0" x2="99.5" y2="10" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function StudioServices({ locale }: { locale: Locale }) {
  const t = studioMessages[locale].services
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:py-28">
        <div className="flex flex-col gap-3">
          <h2 id="services-title" className="text-4xl font-light tracking-[-0.03em] sm:text-5xl">
            {t.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
        </div>
        <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {SERVICES.map((service) => {
            const Icon = serviceIcons[service]
            const item = t.items[service]
            return (
              <li key={service} className="flex flex-col gap-3">
                <DimensionRule />
                <Icon className="size-6 text-leaf" aria-hidden="true" strokeWidth={1.5} />
                <h3 className="text-xl font-medium tracking-tight">{item.name}</h3>
                <p className="leading-relaxed text-muted-foreground">{item.body}</p>
                <p className="text-sm text-leaf">{item.fee}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** Leaves room after the design weeks for the hatched "through the build" bar. */
const SPAN = WEEKS_TO_PERMIT + 8

/**
 * The stages of a house as a schedule: each bar sits at its real weeks and
 * draws in, one after another, when the chart comes into view. It's an
 * ordered list first, so the durations read as text too.
 */
export function StudioProcess({ locale }: { locale: Locale }) {
  const t = studioMessages[locale].process
  // Each stage starts when the ones before it end.
  const rows = STAGES.map((stage, index) => ({
    ...stage,
    index,
    start: STAGES.slice(0, index).reduce((sum, before) => sum + (before.weeks ?? 0), 0),
  }))
  const ticks = Array.from({ length: Math.floor(WEEKS_TO_PERMIT / 4) + 1 }, (_, i) => i * 4)

  return (
    <section id="process" aria-labelledby="process-title" className="scroll-mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="process-title" className="text-4xl font-light tracking-[-0.03em] sm:text-5xl">
            {t.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{t.intro(WEEKS_TO_PERMIT)}</p>
        </div>

        <InView className="group" data-testid="studio-schedule" aria-label={t.chartLabel(WEEKS_TO_PERMIT)} role="group">
          {/* Week axis, aligned with the bar column */}
          <div aria-hidden="true" className="mb-3 hidden grid-cols-[minmax(0,17rem)_1fr] gap-8 md:grid">
            <span className="text-xs text-muted-foreground">{t.axis}</span>
            <div className="relative h-4">
              {ticks.map((week) => (
                <span key={week} className="absolute -translate-x-1/2 text-xs text-muted-foreground tabular-nums" style={{ left: `${(week / SPAN) * 100}%` }}>
                  {week}
                </span>
              ))}
            </div>
          </div>
          <ol className="flex flex-col divide-y divide-border border-y border-border">
            {rows.map((row) => {
              const stage = t.stages[row.id]
              const ongoing = row.weeks === null
              const left = (row.start / SPAN) * 100
              const width = ongoing ? 100 - left : ((row.weeks ?? 0) / SPAN) * 100
              return (
                <li key={row.id} className="grid gap-x-8 gap-y-3 py-5 md:grid-cols-[minmax(0,17rem)_1fr] md:items-center" data-testid="studio-stage">
                  <div className="flex flex-col gap-1">
                    <h3 className="flex items-baseline gap-3 font-medium">
                      <span className="text-sm text-muted-foreground tabular-nums">{row.index + 1}</span>
                      {stage.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
                    {/* The duration as text: visible on phones (a 2-week bar is too narrow to label), read out everywhere. */}
                    <p className="pt-1 text-sm font-medium text-leaf md:sr-only">{ongoing ? t.ongoing : t.weeks(row.weeks ?? 0)}</p>
                  </div>
                  <div className="relative hidden h-9 md:block" aria-hidden="true">
                    {/* Week grid lines */}
                    {ticks.map((week) => (
                      <span key={week} aria-hidden="true" className="absolute inset-y-0 hidden w-px bg-border md:block" style={{ left: `${(week / SPAN) * 100}%` }} />
                    ))}
                    <span
                      data-bar
                      className={`absolute inset-y-1.5 flex origin-left scale-x-0 items-center justify-end rounded-sm px-2 text-xs font-medium whitespace-nowrap transition-transform duration-700 ease-out group-data-[inview]:scale-x-100 motion-reduce:scale-x-100 motion-reduce:transition-none ${
                        ongoing
                          ? "justify-start border border-leaf bg-[repeating-linear-gradient(135deg,var(--shade)_0_6px,transparent_6px_12px)] text-foreground"
                          : "bg-leaf text-white dark:text-background"
                      }`}
                      style={{ left: `${left}%`, width: `${width}%`, transitionDelay: `${0.15 + row.index * 0.25}s` } as CSSProperties}
                    >
                      {ongoing ? t.ongoing : t.weeks(row.weeks ?? 0)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </InView>
      </div>
    </section>
  )
}

export function StudioContactSection({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = studioMessages[locale].contact
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.5fr] lg:py-28">
        <div className="flex flex-col gap-4">
          <h2 id="contact-title" className="text-4xl font-light tracking-[-0.03em] sm:text-5xl">
            {t.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
