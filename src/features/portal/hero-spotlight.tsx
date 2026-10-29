"use client"

import { useEffect, useRef } from "react"
import { usePointerVars } from "@/hooks/use-pointer-vars"

/**
 * A copy of the hero's grid, drawn in the brand colour and shown only in a
 * soft circle around the pointer, so the grid lights up where you look.
 * Listens on the hero section itself (its parent).
 */
export function HeroSpotlight() {
  const layer = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement | null>(null)

  useEffect(() => {
    section.current = layer.current?.parentElement ?? null
  }, [])
  usePointerVars(section)

  return (
    <div
      ref={layer}
      aria-hidden="true"
      className="hero-spotlight pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-[size:48px_48px]"
    />
  )
}
