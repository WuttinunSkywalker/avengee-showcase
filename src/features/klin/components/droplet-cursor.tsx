"use client"

import { useEffect, useRef, type RefObject } from "react"
import { DROPLET_LAGS, follow, stretch } from "../lib/droplet"
import type { SpinBoard } from "../lib/spin"

const SIZE = 320
const RADII = [17, 14, 11, 8]

/**
 * Over a bottle the pointer becomes a drop of liquid: a few blobs trailing
 * the mouse at different lags, merged by a blur-and-threshold filter (the
 * "gooey" metaball trick), the head stretching the way it moves, all drawn
 * in difference blend so it reads on bright beam and dark glass alike. Mouse
 * only; the usual cursor everywhere else, and never with reduced motion.
 */
export function DropletCursor({ board }: { board: RefObject<SpinBoard> }) {
  const layer = useRef<HTMLDivElement>(null)
  const head = useRef<SVGEllipseElement>(null)
  const tail = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const element = layer.current
    if (!element) return
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const page = element.closest<HTMLElement>(".klin-root")
    if (page) page.dataset.droplet = ""
    const target = { x: -SIZE, y: -SIZE }
    const points = DROPLET_LAGS.map(() => ({ x: -SIZE, y: -SIZE }))
    const velocity = { x: 0, y: 0 }
    let last = performance.now()
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      target.x = event.clientX
      target.y = event.clientY
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const over = board.current.hover !== null || board.current.held !== null
      element.dataset.visible = over ? "true" : "false"
      const [lead] = points
      const before = { x: lead.x, y: lead.y }
      points.forEach((point, i) => {
        point.x = follow(point.x, target.x, DROPLET_LAGS[i], dt)
        point.y = follow(point.y, target.y, DROPLET_LAGS[i], dt)
      })
      if (dt > 0) {
        velocity.x = follow(velocity.x, (lead.x - before.x) / dt, 0.3, dt)
        velocity.y = follow(velocity.y, (lead.y - before.y) / dt, 0.3, dt)
      }
      // The small canvas rides with the head; the trail is drawn relative to it
      element.style.transform = `translate3d(${lead.x - SIZE / 2}px, ${lead.y - SIZE / 2}px, 0)`
      const shape = stretch(velocity.x, velocity.y)
      const held = board.current.held !== null ? 0.85 : 1
      head.current?.setAttribute("rx", String(RADII[0] * shape.along * held))
      head.current?.setAttribute("ry", String(RADII[0] * shape.across * (2 - held)))
      head.current?.setAttribute("transform", `rotate(${shape.angle} ${SIZE / 2} ${SIZE / 2})`)
      tail.current.forEach((blob, i) => {
        const point = points[i + 1]
        blob?.setAttribute("cx", String(point.x - lead.x + SIZE / 2))
        blob?.setAttribute("cy", String(point.y - lead.y + SIZE / 2))
      })
      frame = requestAnimationFrame(tick)
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
      if (page) delete page.dataset.droplet
    }
  }, [board])

  return (
    <div ref={layer} className="klin-droplet" data-visible="false" aria-hidden="true" data-testid="klin-droplet">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <filter id="klin-goo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
          </filter>
        </defs>
        <g filter="url(#klin-goo)" fill="#f1ebdf">
          <ellipse ref={head} cx={SIZE / 2} cy={SIZE / 2} rx={RADII[0]} ry={RADII[0]} />
          {RADII.slice(1).map((radius, i) => (
            <circle
              key={radius}
              ref={(element) => {
                tail.current[i] = element
              }}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
