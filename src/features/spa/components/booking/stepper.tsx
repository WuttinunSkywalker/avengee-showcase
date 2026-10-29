"use client"

import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { BOOKING_STEPS, stepIndex, type StepId } from "../../lib/booking-flow"

export function Stepper({
  current,
  completed,
  onNavigate,
}: {
  current: StepId
  completed: Record<StepId, boolean>
  onNavigate: (step: StepId) => void
}) {
  const { t } = useSpaI18n()
  const currentIndex = stepIndex(current)

  return (
    <nav aria-label={t.steps.progress}>
      <ol className="grid grid-cols-4 gap-2">
        {BOOKING_STEPS.map((step, index) => {
          const isCurrent = step.id === current
          const isDone = index < currentIndex || (completed[step.id] && !isCurrent)
          // Guests can jump back, or forward only through completed steps.
          const reachable = index <= currentIndex || BOOKING_STEPS.slice(0, index).every((s) => completed[s.id])

          return (
            <li key={step.id} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className={cn("h-1 rounded-full bg-border transition-colors duration-300", (isDone || isCurrent) && "bg-primary")}
              />
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                disabled={!reachable || isCurrent}
                aria-current={isCurrent ? "step" : undefined}
                className="flex items-center gap-1.5 rounded-sm text-left text-xs font-medium text-muted-foreground enabled:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default aria-[current=step]:text-foreground sm:text-sm"
              >
                {isDone && <CheckIcon className="size-3.5 shrink-0 text-celadon-deep dark:text-celadon" aria-hidden="true" />}
                <span className="truncate">
                  <span className="sr-only">{t.steps.stepOf(index + 1, BOOKING_STEPS.length)}: </span>
                  {t.steps.labels[step.id]}
                  {isDone && <span className="sr-only">{t.steps.done}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
