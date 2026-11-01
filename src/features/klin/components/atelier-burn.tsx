"use client"

import { useEffect, useRef, useState } from "react"
import { BURN_MS, burnAt, burnLevel } from "../lib/burn"
import { valueNoise } from "../lib/noise"
import { hexToRgb } from "../lib/story"

/** One canvas pixel for this many screen pixels: the burn is soft, so a small canvas scaled up is plenty. */
const SCALE = 4
/** Noise drawn once at this size and wrapped if the atelier is bigger: large enough that its pattern never visibly repeats. */
const NOISE = 256

/**
 * The atelier, the one paper-light part of the page, burns in from the dark
 * page above as it scrolls into view: the page's own colour lies over it and
 * burns away through the same seeded noise as the 3D floors, an ember edge in
 * the scent's glow leading and a smoky fringe trailing on the paper. It plays
 * once, on the clock (never left half-burnt by a stopped scroll), then goes.
 * Only a picture (aria-hidden); skipped for reduced motion or if the atelier
 * is already in view when the page opens.
 */
export function AtelierBurn() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const node = canvas.current
    const section = node?.parentElement
    const context = node?.getContext("2d")
    if (!node || !section || !context) return
    const finish = () => setDone(true)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || section.getBoundingClientRect().top < window.innerHeight) {
      finish()
      return
    }
    const width = Math.ceil(section.clientWidth / SCALE)
    const height = Math.ceil(section.clientHeight / SCALE)
    node.width = width
    node.height = height
    const noise = valueNoise(NOISE, "klin:atelier-burn", 5)
    const levels = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) levels[y * width + x] = burnLevel(noise[(y % NOISE) * NOISE + (x % NOISE)] / 255, y / height)
    }
    const image = context.createImageData(width, height)
    const colour = (name: string, fallback: string) => {
      const value = getComputedStyle(section).getPropertyValue(name).trim()
      return hexToRgb(/^#[0-9a-f]{6}$/i.test(value) ? value : fallback)
    }
    const draw = (progress: number) => {
      // The page's colour as it is when the burn starts (it follows the scroll), and the scent's glow
      const page = colour("--klin-backdrop", "#2a1a12")
      const glow = colour("--klin-accent", "#e2b27a")
      const data = image.data
      for (let i = 0; i < levels.length; i++) {
        const { cover, ember, scorch } = burnAt(levels[i], progress)
        const o = i * 4
        // The page, heating to the glow (and a touch brighter) along the edge; behind it, a smoky fringe on the paper
        for (let c = 0; c < 3; c++) data[o + c] = Math.min(255, page[c] + (glow[c] * 1.25 - page[c]) * ember)
        data[o + 3] = Math.round(Math.max(cover, scorch * scorch * 0.6) * 255)
      }
      context.putImageData(image, 0, 0)
    }
    draw(0)

    let frame = 0
    const burn = () => {
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / BURN_MS)
        // Catches slowly, then runs
        draw(t * t * (3 - 2 * t))
        if (t < 1) frame = requestAnimationFrame(step)
        else finish()
      }
      frame = requestAnimationFrame(step)
    }
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        seen.disconnect()
        burn()
      },
      { threshold: 0.3 },
    )
    seen.observe(section)
    return () => {
      cancelAnimationFrame(frame)
      seen.disconnect()
    }
  }, [])

  if (done) return null
  return <canvas ref={canvas} aria-hidden="true" data-testid="atelier-burn" className="pointer-events-none absolute inset-0 z-10 size-full" />
}
