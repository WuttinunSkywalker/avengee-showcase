"use client"

import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/locale-provider"
import { shopMessages } from "../../i18n/messages"
import { formatShortDate } from "../../lib/format"
import { bangkokDate, bangkokTime, type TrackingStep } from "../../lib/tracking"

/** Vertical timeline: done steps in leaf green, the current step ringed, upcoming steps muted. */
export function TrackingTimeline({ steps, waitingForPayment }: { steps: TrackingStep[]; waitingForPayment: boolean }) {
  const locale = useLocale()
  const t = shopMessages[locale].tracking

  return (
    <ol className="flex flex-col" aria-label={t.title}>
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        const at = step.at ? new Date(step.at) : null
        const when = at ? `${formatShortDate(bangkokDate(at), locale)} ${bangkokTime(at)}` : null
        return (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0" data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={cn("absolute top-7 bottom-0 left-[0.6875rem] w-0.5", step.state === "done" ? "bg-leaf" : "bg-border")}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                step.state === "done" && "border-leaf bg-leaf text-white",
                step.state === "current" && "border-primary bg-background ring-4 ring-primary/15",
                step.state === "upcoming" && "border-border bg-background",
              )}
            >
              {step.state === "done" && <CheckIcon className="size-3.5" />}
              {step.state === "current" && <span className="size-2 rounded-full bg-primary" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className={cn("font-medium", step.state === "upcoming" && "text-muted-foreground")}>
                  {step.id === "paid" && waitingForPayment ? t.awaitingPayment : t.steps[step.id]}
                </p>
                {when && (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {step.state === "done" ? when : `${t.expected} ${when}`}
                  </p>
                )}
              </div>
              {step.state !== "upcoming" && (
                <p className="text-sm text-muted-foreground">
                  {step.id === "paid" && waitingForPayment ? t.waiting : t.detail[step.id]}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
