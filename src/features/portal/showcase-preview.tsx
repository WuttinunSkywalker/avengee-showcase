"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { Showcase } from "@/config/site"
import type { Locale } from "@/i18n/config"
import { usePointerVars } from "@/hooks/use-pointer-vars"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"

/** How long each screen stays up while the card is hovered or focused. */
export const PREVIEW_INTERVAL_MS = 2200

/**
 * The card's screenshot area. While the card is hovered or focused it steps
 * through the app's screens (home, then each `images.tour` screen); the dots
 * pick a screen directly, by mouse, touch or keyboard. Visitors who ask for
 * reduced motion only get the dots, never the autoplay.
 */
export function ShowcasePreview({ showcase, locale, active }: { showcase: Showcase; locale: Locale; active: boolean }) {
  const t = portalMessages[locale].showcases
  const reduceMotion = useReducedMotion()
  const images = showcase.images!
  // Screens that failed to load drop out (with their dot), so a card never shows a broken image.
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set())
  const slides = [
    { src: images.desktop[locale], label: t.home, alt: images.alt[locale] },
    ...(images.tour ?? []).map((screen) => ({ src: screen.src[locale], label: screen.label[locale], alt: `${showcase.name}: ${screen.label[locale]}` })),
  ].filter((slide, i) => i === 0 || !broken.has(slide.src))
  const [rawIndex, setIndex] = useState(0)
  const index = rawIndex < slides.length ? rawIndex : 0
  const [chosen, setChosen] = useState(false)
  const autoplay = active && !chosen && !reduceMotion && slides.length > 1

  useEffect(() => {
    if (!autoplay) return
    const id = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), PREVIEW_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [autoplay, slides.length])

  // Leaving the card puts it back on the home screen, ready for the next visit.
  const [wasActive, setWasActive] = useState(active)
  if (wasActive !== active) {
    setWasActive(active)
    if (!active) {
      setIndex(0)
      setChosen(false)
    }
  }

  const controlsSide = images.phoneSide === "left" ? "right-3" : "left-3"
  // The screenshot tilts toward the pointer, with a glare that follows it.
  const tiltRef = useRef<HTMLDivElement>(null)
  usePointerVars(tiltRef)

  return (
    <div ref={tiltRef} data-testid="preview-tilt" className="tilt relative overflow-clip border-b border-border bg-muted lg:border-r lg:border-b-0">
      <div aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 z-10" />
      <div className="reveal-wipe relative h-full">
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            aria-hidden={i === index ? undefined : true}
            width={1440}
            height={900}
            sizes="(min-width: 1024px) 700px, 100vw"
            loading={i === 0 ? "eager" : "lazy"}
            style={{ objectPosition: i === 0 ? (images.focus ?? "left top") : "left top" }}
            data-active={i === index || undefined}
            onError={i === 0 ? undefined : () => setBroken((current) => new Set(current).add(slide.src))}
            className={cn(
              "h-full w-full object-cover transition-[opacity,scale] duration-700 group-hover:scale-[1.02] motion-reduce:transition-none",
              i > 0 && "absolute inset-0",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {/* Phone view, tucked into the corner on the home screen; it steps aside for the other screens. */}
      <div
        className={cn(
          "absolute bottom-4 hidden transition-opacity duration-500 sm:block motion-reduce:transition-none",
          images.phoneSide === "left" ? "left-4" : "right-4",
          index === 0 ? "opacity-100" : "opacity-0",
        )}
      >
        <Image
          src={images.mobile[locale]}
          alt=""
          width={393}
          height={659}
          sizes="140px"
          className="reveal-phone w-32 rounded-[1.1rem] border-[3px] border-foreground/85 shadow-2xl transition-[translate] duration-500 group-hover:-translate-y-2 lg:w-36 motion-reduce:transition-none"
        />
      </div>

      {slides.length > 1 && (
        <div
          role="group"
          aria-label={t.screens(showcase.name)}
          className={cn("absolute bottom-3 flex items-center gap-1 rounded-full bg-background/90 py-0.5 pr-3 pl-1 shadow-md backdrop-blur", controlsSide)}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={slide.label}
              aria-pressed={i === index}
              onClick={() => {
                setIndex(i)
                setChosen(true)
              }}
              className="flex size-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none",
                  i === index ? "w-4 bg-primary" : "w-1.5 bg-foreground/30",
                )}
              />
            </button>
          ))}
          <span className="text-xs font-medium" data-testid="preview-label">
            {slides[index].label}
          </span>
        </div>
      )}
    </div>
  )
}
