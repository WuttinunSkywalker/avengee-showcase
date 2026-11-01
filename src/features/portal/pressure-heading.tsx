"use client"

import { Fragment, useEffect, useMemo, useRef } from "react"
import { kineticPhrases, PRESSURE, pressureWeight } from "./kinetic"

/**
 * The contact heading, whose letters thicken toward a mouse (as in "Text
 * Pressure"): each letter's weight rises on a bell curve the nearer the
 * pointer is, along the font's weight axis. Every letter sits in a box as
 * wide as it is at its heaviest, so the lines never rewrap as weights change.
 * Hidden from assistive tech (the heading carries the text as its label);
 * mouse only, and still for reduced motion.
 */
export function PressureHeading({ text, locale }: { text: string; locale: string }) {
  const phrases = useMemo(() => kineticPhrases(text, locale), [text, locale])
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const heading = root.current?.parentElement
    const section = heading?.closest("section")
    if (!heading || !section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const letters = Array.from(heading.querySelectorAll<HTMLElement>(".pressure-letter"))
    let homes: { x: number; y: number }[] = []
    let reach = 0
    // Box each letter at its heaviest, then note where its centre sits in the heading
    const measure = () => {
      for (const letter of letters) letter.style.removeProperty("width")
      heading.style.fontWeight = String(PRESSURE.heaviest)
      const widths = letters.map((letter) => letter.getBoundingClientRect().width)
      heading.style.removeProperty("font-weight")
      letters.forEach((letter, i) => (letter.style.width = `${widths[i].toFixed(2)}px`))
      homes = letters.map((letter) => ({ x: letter.offsetLeft + letter.offsetWidth / 2, y: letter.offsetTop + letter.offsetHeight / 2 }))
      reach = parseFloat(getComputedStyle(heading).fontSize) * 2.2
    }
    const weights = letters.map(() => PRESSURE.rest)
    let pointer: { x: number; y: number } | null = null
    let frame = 0

    const step = () => {
      const box = heading.getBoundingClientRect()
      let moving = false
      letters.forEach((letter, i) => {
        const goal = pointer ? pressureWeight(Math.hypot(homes[i].x + box.left - pointer.x, homes[i].y + box.top - pointer.y), reach) : PRESSURE.rest
        if (Math.abs(goal - weights[i]) < 1) {
          if (weights[i] !== goal) {
            weights[i] = goal
            if (goal === PRESSURE.rest) letter.style.removeProperty("font-weight")
            else letter.style.fontWeight = String(goal)
          }
          return
        }
        weights[i] += (goal - weights[i]) * 0.2
        letter.style.fontWeight = String(Math.round(weights[i]))
        moving = true
      })
      frame = moving ? requestAnimationFrame(step) : 0
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      pointer = { x: event.clientX, y: event.clientY }
      heading.dataset.pressed = ""
      wake()
    }
    const leave = () => {
      pointer = null
      delete heading.dataset.pressed
      wake()
    }
    // Boxed from the start (so the lines never shift when the mouse arrives), and again when the
    // heading's size changes with the window or the font arrives late
    let remeasure = 0
    const again = () => {
      cancelAnimationFrame(remeasure)
      remeasure = requestAnimationFrame(measure)
    }
    measure()
    const resized = new ResizeObserver(again)
    resized.observe(heading)
    document.fonts?.ready.then(again, () => {})
    section.addEventListener("pointermove", move)
    section.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(remeasure)
      resized.disconnect()
      section.removeEventListener("pointermove", move)
      section.removeEventListener("pointerleave", leave)
    }
  }, [phrases])

  return (
    <span ref={root} aria-hidden="true">
      {phrases.map((phrase, i) => (
        <Fragment key={i}>
          <span className="kinetic-phrase">
            {phrase.map((word, j) => (
              <span key={j} className="kinetic-word">
                {word.map((letter, k) => (
                  <span key={k} className="pressure-letter">
                    {letter.text}
                  </span>
                ))}
              </span>
            ))}
          </span>
          {i < phrases.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  )
}
