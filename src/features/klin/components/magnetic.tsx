"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { FOLLOW, magnetPull, RELEASE, springSettled, springStep, type Spring } from "../lib/magnet"

/**
 * Wraps a button so it leans toward a nearby mouse and springs back with a
 * little bounce when the mouse moves off (as in Codrops' magnetic buttons).
 * The wrapper moves, so the button keeps its own hover and press transitions.
 * Mouse only; nothing moves for touch or reduced motion.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    let x: Spring = { position: 0, velocity: 0 }
    let y: Spring = { position: 0, velocity: 0 }
    let target = { x: 0, y: 0 }
    let held = false
    let frame = 0
    let last = 0

    const step = (time: number) => {
      const seconds = last ? (time - last) / 1000 : 1 / 60
      last = time
      const feel = held ? FOLLOW : RELEASE
      x = springStep(x, target.x, seconds, feel)
      y = springStep(y, target.y, seconds, feel)
      if (springSettled(x, target.x) && springSettled(y, target.y)) {
        frame = 0
        last = 0
        if (held) node.style.translate = `${target.x}px ${target.y}px`
        else node.style.removeProperty("translate")
        return
      }
      node.style.translate = `${x.position.toFixed(2)}px ${y.position.toFixed(2)}px`
      frame = requestAnimationFrame(step)
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    let pointer: { x: number; y: number } | null = null
    const check = () => {
      if (!pointer) return
      const box = node.getBoundingClientRect()
      // The resting centre: where the button is drawn, less how far it leans now
      const pull = magnetPull(pointer.x - (box.left + box.width / 2 - x.position), pointer.y - (box.top + box.height / 2 - y.position), box.width, box.height)
      if (!pull && !held) return
      held = pull !== null
      target = pull ?? { x: 0, y: 0 }
      if (held) node.dataset.magnet = ""
      else delete node.dataset.magnet
      wake()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      pointer = { x: event.clientX, y: event.clientY }
      check()
    }
    // The page can scroll a button away from a resting mouse, and the mouse can leave the window
    const away = () => {
      pointer = { x: -1e4, y: -1e4 }
      check()
      pointer = null
    }
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("scroll", check, { passive: true })
    document.documentElement.addEventListener("pointerleave", away)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("scroll", check)
      document.documentElement.removeEventListener("pointerleave", away)
    }
  }, [])

  return (
    <span ref={ref} data-testid="klin-magnet" className={cn("inline-block", className)}>
      {children}
    </span>
  )
}
