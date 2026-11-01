"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/locale-provider"
import { klin } from "../data/scents"
import { klinMessages } from "../i18n/messages"
import { INTRO_FALL, INTRO_HOLD, stripDelays } from "../lib/intro"

const SEEN = "klin:intro-seen"
const delays = stripDelays()

function seenBefore(): boolean {
  try {
    return window.localStorage.getItem(SEEN) === "1"
  } catch {
    return false
  }
}

/**
 * The curtain before the storm: the page colour with the house name, a thin
 * line filling like a falling drop while the 3D layer loads, then strips that
 * fall away like sheets of rain, parting from the bottle's side. First visits
 * hold until the scene is ready (within limits); return visits part straight
 * away; reduced motion never shows it (see globals.css). It's only a picture:
 * hidden from assistive tech and never in the way of a click.
 */
export function KlinIntro({ ready }: { ready: boolean }) {
  const locale = useLocale()
  const t = klinMessages[locale]
  const [phase, setPhase] = useState<"hold" | "reveal" | "done">("hold")
  const [start] = useState(() => (typeof performance === "undefined" ? 0 : performance.now()))
  const [returning] = useState(() => typeof window !== "undefined" && seenBefore())

  useEffect(() => {
    if (phase !== "hold") return
    const elapsed = performance.now() - start
    const wait = returning ? 0 : ready ? Math.max(0, INTRO_HOLD.min - elapsed) : Math.max(0, INTRO_HOLD.max - elapsed)
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(SEEN, "1")
      } catch {
        // Private windows may refuse storage; the curtain just holds again next time
      }
      setPhase("reveal")
    }, wait)
    return () => window.clearTimeout(timer)
  }, [phase, ready, returning, start])

  useEffect(() => {
    if (phase !== "reveal") return
    const timer = window.setTimeout(() => setPhase("done"), Math.max(...delays) + INTRO_FALL + 100)
    return () => window.clearTimeout(timer)
  }, [phase])

  if (phase === "done") return null
  return (
    <div className="klin-intro" data-state={phase} aria-hidden="true" data-testid="klin-intro">
      <div className="klin-intro-strips">
        {delays.map((delay, i) => (
          <span key={i} style={{ "--d": `${delay}ms` } as React.CSSProperties} />
        ))}
      </div>
      <div className="klin-intro-mark">
        <span className="font-heading text-6xl leading-none tracking-[0.04em] sm:text-7xl" translate="no">
          {klin.name}
        </span>
        <span className="text-sm text-muted-foreground">{t.tagline}</span>
        <span className="klin-intro-drop" />
      </div>
    </div>
  )
}
