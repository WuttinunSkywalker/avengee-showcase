"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { ServerIcon } from "lucide-react"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"

/** Seconds: each connector fills in turn, and the step it reaches lights up as it arrives. */
const FILL = 0.7
const START = 0.3
const GAP = 0.8
const at = (seconds: number) => ({ transitionDelay: `${seconds}s` }) as CSSProperties

/**
 * "How we work" as a stepper that ends at a live server. When it scrolls into
 * view the line runs 1 → 2 → 3 → server and each step fills as it's reached.
 * Plain transitions started by an IntersectionObserver, so it works in every
 * browser; reduced motion shows the finished state.
 */
export function ProcessSteps() {
  const locale = useLocale()
  const t = portalMessages[locale].process
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.disconnect()
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const reached = (i: number) => (i === 0 ? 0.1 : START + (i - 1) * GAP + FILL)
  const live = reached(t.steps.length)

  return (
    <div ref={ref} data-inview={inView || undefined} data-testid="process-steps" className="group/steps relative flex flex-col gap-10">
      <ol className="grid gap-10 md:grid-cols-3">
        {t.steps.map((step, index) => (
          <li key={step.title} className="relative grid grid-cols-[3.5rem_1fr] gap-x-5 md:flex md:flex-col md:gap-5">
            {/* Connector to the next step, or from the last step to the server */}
            <span aria-hidden="true" className="absolute top-16 -bottom-8 left-7 w-0.5 -translate-x-1/2 rounded-full bg-border md:hidden">
              <span
                data-connector
                className="block size-full origin-top scale-y-0 rounded-full bg-primary transition-transform ease-out group-data-[inview]/steps:scale-y-100 motion-reduce:transition-none"
                style={{ ...at(START + index * GAP), transitionDuration: `${FILL}s` }}
              />
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-7 left-16 hidden h-0.5 -translate-y-1/2 rounded-full bg-border md:block",
                index === t.steps.length - 1 ? "right-[4.5rem]" : "-right-8",
              )}
            >
              <span
                data-connector
                className="block size-full origin-left scale-x-0 rounded-full bg-primary transition-transform ease-out group-data-[inview]/steps:scale-x-100 motion-reduce:transition-none"
                style={{ ...at(START + index * GAP), transitionDuration: `${FILL}s` }}
              />
            </span>
            <span
              className="relative flex size-14 items-center justify-center rounded-full border-2 border-primary bg-background font-heading text-2xl font-semibold text-primary tabular-nums transition-colors duration-300 group-data-[inview]/steps:bg-primary group-data-[inview]/steps:text-primary-foreground motion-reduce:transition-none"
              style={at(reached(index))}
            >
              {index + 1}
            </span>
            <div className={cn("flex flex-col gap-2 pt-3 md:pt-0", index === t.steps.length - 1 && "md:pr-20")}>
              <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Where the work ends up: the client's site, live on a server */}
      <div data-testid="process-live" className="grid grid-cols-[3.5rem_1fr] items-center gap-x-5 md:absolute md:top-0 md:right-0 md:flex md:flex-col md:items-center md:gap-2">
        <span
          className="relative flex size-14 items-center justify-center rounded-2xl border-2 border-border bg-background text-muted-foreground transition-colors duration-500 group-data-[inview]/steps:border-primary group-data-[inview]/steps:bg-primary group-data-[inview]/steps:text-primary-foreground motion-reduce:transition-none"
          style={at(live)}
        >
          <ServerIcon className="size-6" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex size-3.5 opacity-0 transition-opacity duration-300 group-data-[inview]/steps:opacity-100 motion-reduce:transition-none"
            style={at(live + 0.2)}
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-3.5 rounded-full border-2 border-background bg-signal" />
          </span>
        </span>
        <span
          className="text-sm font-medium text-muted-foreground transition-colors duration-500 group-data-[inview]/steps:text-foreground motion-reduce:transition-none"
          style={at(live)}
        >
          {t.live}
        </span>
      </div>
    </div>
  )
}
