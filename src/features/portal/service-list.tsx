"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { Locale } from "@/i18n/config"
import { stagger } from "@/lib/motion"
import { portalMessages } from "./messages"
import { previewTilt, previewTop, servicePreview } from "./service-previews"

/**
 * "What we build" as a list of rows. On wide screens with a mouse, pointing
 * at a row floats a screen from the matching app into the free space on the
 * right: it glides up and down with the pointer, tips as it moves, and leans
 * a little toward it. It never covers the text, it's only a picture
 * (aria-hidden), and nothing floats for touch or reduced motion.
 */
export function ServiceList({ locale }: { locale: Locale }) {
  const t = portalMessages[locale]
  const previews = t.services.items.map((_, index) => servicePreview(index, locale, t.showcases.home))
  // The row pointed at; the last one stays chosen while the picture fades out
  const [hover, setHover] = useState({ index: 0, on: false })
  const list = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = list.current
    const float = card.current
    if (!node || !float) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let target = { x: 0, y: 0 }
    let at = { x: 0, y: 0, tilt: 0 }
    let fresh = true
    let frame = 0

    const step = () => {
      const before = at.y
      at.x += (target.x - at.x) * 0.14
      at.y += (target.y - at.y) * 0.14
      at.tilt += (previewTilt(at.y - before) - at.tilt) * 0.2
      float.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0) rotate(${at.tilt.toFixed(2)}deg)`
      const settled = Math.abs(target.x - at.x) < 0.3 && Math.abs(target.y - at.y) < 0.3 && Math.abs(at.tilt) < 0.05
      frame = settled ? 0 : requestAnimationFrame(step)
    }
    const move = (event: PointerEvent) => {
      // Hidden (narrow screens) or touch: nothing to place
      if (event.pointerType === "touch" || !float.offsetWidth) return
      const box = node.getBoundingClientRect()
      const lean = (event.clientX - (box.right - float.offsetWidth / 2)) * 0.06
      target = { x: Math.max(-12, Math.min(12, lean)), y: previewTop(event.clientY - box.top, box.height, float.offsetHeight) }
      // A fresh visit appears where the pointer is, rather than gliding in from the last spot
      if (fresh) {
        at = { ...target, tilt: 0 }
        fresh = false
      }
      if (!frame) frame = requestAnimationFrame(step)
    }
    const leave = () => {
      fresh = true
    }
    node.addEventListener("pointermove", move)
    node.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
      node.removeEventListener("pointermove", move)
      node.removeEventListener("pointerleave", leave)
    }
  }, [])

  return (
    <div ref={list} className="relative" onPointerLeave={() => setHover((current) => ({ ...current, on: false }))}>
      <dl data-testid="service-list" className="flex flex-col">
        {t.services.items.map((service, index) => (
          <div
            key={service.name}
            data-active={(hover.on && hover.index === index) || undefined}
            onPointerEnter={(event) => event.pointerType !== "touch" && setHover({ index, on: true })}
            className="group/service relative grid gap-2 py-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[17rem_minmax(0,26rem)]"
          >
            <span
              aria-hidden="true"
              className="reveal-rule absolute inset-x-0 top-0 h-0.5 bg-foreground after:absolute after:inset-0 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-500 group-data-active/service:after:scale-x-100 motion-reduce:after:transition-none"
              style={stagger(index)}
            />
            <dt
              className="reveal font-heading text-2xl font-semibold tracking-tight transition-[translate,color] duration-300 group-data-active/service:text-primary motion-safe:group-data-active/service:translate-x-2 sm:text-3xl"
              style={stagger(index)}
            >
              {service.name}
            </dt>
            <dd className="reveal leading-relaxed text-muted-foreground sm:pt-1.5" style={stagger(index + 1)}>
              {service.body}
            </dd>
          </div>
        ))}
      </dl>
      <div
        ref={card}
        aria-hidden="true"
        data-testid="service-preview"
        data-visible={hover.on && previews[hover.index] !== null}
        className="service-preview pointer-events-none absolute top-0 right-0 hidden w-[20rem] will-change-transform xl:block"
      >
        <div className="service-preview-card">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted shadow-2xl">
            {previews.map((preview, index) =>
              preview ? (
                <Image
                  key={preview.src}
                  src={preview.src}
                  alt=""
                  fill
                  sizes="320px"
                  data-active={hover.index === index || undefined}
                  className="object-cover object-top opacity-0 transition-opacity duration-300 data-active:opacity-100"
                />
              ) : null,
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{previews[hover.index]?.label}</p>
        </div>
      </div>
    </div>
  )
}
