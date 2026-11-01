"use client"

import { useEffect } from "react"
import { toneAt, type Tone } from "./tones"

/**
 * Lets the page's colour ease from section to section: each tinted section
 * (data-tone) goes see-through and the page behind takes the tone of the one
 * under the middle of the screen, scrolling either way and after a reload
 * part-way down. Without script or with reduced motion each section simply
 * keeps its own tint (see .portal-tones in globals.css).
 */
export function SectionTones() {
  useEffect(() => {
    const main = document.getElementById("main")
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const sections = Array.from(main.querySelectorAll<HTMLElement>("[data-tone]"))
    let frame = 0
    const update = () => {
      frame = 0
      const tone = toneAt(
        sections.map((section) => ({ tone: section.dataset.tone as Tone, top: section.getBoundingClientRect().top })),
        window.innerHeight / 2,
      )
      if (tone && main.dataset.tone !== tone) main.dataset.tone = tone
    }
    update()
    main.dataset.tones = ""
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      delete main.dataset.tones
      delete main.dataset.tone
    }
  }, [])
  return null
}
