"use client"

import { Fragment, useEffect, useMemo, useRef } from "react"
import { kineticPhrases, pushAway } from "./kinetic"

/**
 * The hero headline as kinetic type: its letters drop in like rain on load
 * (CSS, each at its own --d), and with a mouse the letters near the pointer
 * lean away from it and warm toward the brand colour, settling back when it
 * leaves. Hidden from assistive tech: the heading carries the text as its
 * label. Nothing moves with reduced motion.
 */
export function KineticHeadline({ text, locale }: { text: string; locale: string }) {
  const phrases = useMemo(() => kineticPhrases(text, locale), [text, locale])
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const heading = root.current?.parentElement
    const section = heading?.closest("section")
    if (!heading || !section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const letters = Array.from(heading.querySelectorAll<HTMLElement>(".kinetic-letter"))
    // Letter centres inside the heading, from layout (offsets ignore the push and the drop)
    let homes: { x: number; y: number }[] = []
    let reach = 0
    let strength = 0
    const measure = () => {
      homes = letters.map((letter) => ({ x: letter.offsetLeft + letter.offsetWidth / 2, y: letter.offsetTop + letter.offsetHeight / 2 }))
      const size = parseFloat(getComputedStyle(heading).fontSize)
      reach = size * 1.7
      strength = size * 0.16
    }
    const now = letters.map(() => ({ x: 0, y: 0, heat: 0 }))
    let pointer: { x: number; y: number } | null = null
    let frame = 0

    const step = () => {
      if (!homes.length) measure()
      const box = heading.getBoundingClientRect()
      let moving = false
      letters.forEach((letter, i) => {
        const goal = pointer ? pushAway(homes[i].x + box.left - pointer.x, homes[i].y + box.top - pointer.y, reach, strength) : { x: 0, y: 0, heat: 0 }
        const at = now[i]
        // Each letter is already where it's headed: leave it (and its styles) alone
        if (Math.abs(goal.x - at.x) < 0.05 && Math.abs(goal.y - at.y) < 0.05 && Math.abs(goal.heat - at.heat) < 0.01) {
          if (goal.heat === 0 && at.heat !== 0) {
            now[i] = { x: 0, y: 0, heat: 0 }
            letter.style.removeProperty("translate")
            letter.style.removeProperty("--heat")
          }
          return
        }
        at.x += (goal.x - at.x) * 0.2
        at.y += (goal.y - at.y) * 0.2
        at.heat += (goal.heat - at.heat) * 0.2
        moving = true
        letter.style.translate = `${at.x.toFixed(2)}px ${at.y.toFixed(2)}px`
        letter.style.setProperty("--heat", at.heat.toFixed(3))
      })
      // Stops once every letter has settled; the next pointer move starts it again
      frame = moving ? requestAnimationFrame(step) : 0
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      pointer = { x: event.clientX, y: event.clientY }
      heading.dataset.pointer = ""
      wake()
    }
    const leave = () => {
      pointer = null
      delete heading.dataset.pointer
      wake()
    }
    // Lines can rewrap when the window or the font changes
    const resized = new ResizeObserver(() => {
      homes = []
    })
    resized.observe(heading)
    document.fonts?.ready.then(
      () => {
        homes = []
      },
      () => {},
    )
    section.addEventListener("pointermove", move)
    section.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
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
                  <span key={k} className="kinetic-letter" style={{ "--d": letter.delay } as React.CSSProperties}>
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
