"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(SplitText)

const TARGETS = "[data-split], .reveal, .reveal-rule, .reveal-wipe, .reveal-phone"

/**
 * Section-by-section motion for the portal. Each piece plays once as it scrolls
 * into view, in every browser:
 * - `[data-split]` headings rise line by line from behind a mask (GSAP SplitText
 *   finds the lines; it splits synchronously and needs no animation clock)
 * - `.reveal` blocks slide up out of a clip (no opacity, so contrast never dips)
 * - `.reveal-rule` lines draw across, `.reveal-wipe` screenshots open from a
 *   rounded inset, `.reveal-phone` mock-ups settle in after them
 * An IntersectionObserver marks each one `data-shown`; CSS transitions do the
 * moving (see "Portal reveals" in globals.css). Nothing starts hidden until
 * this runs (`main[data-motion]`), and it doesn't run for reduced motion.
 */
export function PortalMotion() {
  useEffect(() => {
    const main = document.querySelector("main")
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const splits = [...main.querySelectorAll<HTMLElement>("[data-split]")].map((heading) => {
      const split = SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "split-line" })
      split.lines.forEach((line, i) => (line as HTMLElement).style.setProperty("--l", String(i)))
      return split
    })

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.shown = ""
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    for (const el of main.querySelectorAll(TARGETS)) observer.observe(el)
    main.dataset.motion = ""

    return () => {
      observer.disconnect()
      delete main.dataset.motion
      for (const split of splits) split.revert()
    }
  }, [])

  return null
}
