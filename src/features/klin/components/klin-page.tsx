"use client"

import dynamic from "next/dynamic"
import { Component, Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { SkipLink } from "@/components/skip-link"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"
import { klin, scents, type Scent, type ScentId } from "../data/scents"
import { klinMessages } from "../i18n/messages"
import { headlinePieces } from "../lib/headline"
import { followSpeed, speedAmount } from "../lib/speed"
import { formatPrice, sceneAt, storyPosition, type SceneState, type SectionBox } from "../lib/story"
import { KlinHeader } from "./header"
import { KlinIntro } from "./intro"
import { DropletCursor } from "./droplet-cursor"
import { SpinZones } from "./spin-zones"
import { emptyBoard, type SpinBoard } from "../lib/spin"
import type { ChosenSize, ScrollMotion } from "./scene"
import { ScentSheet } from "./scent-sheet"

const KlinScene = dynamic(() => import("./scene").then((module) => module.KlinScene), { ssr: false })

const reducedQuery = "(prefers-reduced-motion: reduce)"
function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(reducedQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** Null on the server and during hydration, then whether the visitor asked for less motion. */
function useReducedMotion(): boolean | null {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => null)
}

let webglSupport: boolean | undefined
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      webglSupport = Boolean(document.createElement("canvas").getContext("webgl2"))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}
const noSubscription = () => () => {}

/** If the 3D layer can't run on this device, the page carries on without it. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function KlinPage() {
  const locale = useLocale()
  const t = klinMessages[locale]
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const chapters = useRef<(HTMLElement | null)[]>([])
  const collection = useRef<HTMLElement>(null)
  const state = useRef<SceneState>(sceneAt({ hero: 0, chapter: 0, lineup: 0 }))
  const [chosen, setChosen] = useState<ScentId | null>(null)
  // The size picked in the scent sheet, so the 3D bottle can take its proportions while the sheet is open
  const size = useRef<ChosenSize>({ scent: null, ml: 50, engraving: "" })
  // Bottles spun by dragging, shared by the grab handles and the 3D layer
  const spin = useRef<SpinBoard>(emptyBoard())
  // Scroll speed from −1 to 1, shared with the 3D layer
  const motion = useRef<ScrollMotion>({ speed: 0 })
  // Checked once in the browser; false on the server
  const webgl = useSyncExternalStore(noSubscription, hasWebGL, () => false)
  // The opening curtain holds until the 3D layer has its textures (or there's no 3D layer to wait for)
  const [sceneReady, setSceneReady] = useState(false)

  // Scroll position → scene state, page colour and the chapter on screen
  useEffect(() => {
    const page = root.current
    if (!page || !hero.current || !collection.current) return
    let layout: { hero: SectionBox; chapters: SectionBox[]; collectionTop: number }
    const box = (element: Element): SectionBox => {
      const rect = element.getBoundingClientRect()
      return { top: rect.top + window.scrollY, height: rect.height }
    }
    const measure = () => {
      layout = {
        hero: box(hero.current!),
        chapters: chapters.current.filter((element): element is HTMLElement => element !== null).map(box),
        collectionTop: box(collection.current!).top,
      }
    }
    const update = () => {
      const position = storyPosition(window.scrollY, window.innerHeight, layout)
      const scene = sceneAt(position)
      state.current = scene
      page.style.setProperty("--klin-backdrop", scene.backdrop)
      page.style.setProperty("--klin-accent", scene.accent)
      page.dataset.scent = scene.scent.id
      // The headline's letters fall as the hero scrolls away (not for reduced motion, where data-motion is never set)
      page.style.setProperty("--fall", page.dataset.motion === undefined ? "0" : String(position.hero))
      // Which grab handles to show: over the single bottle, over the line-up, or none (cards and atelier)
      page.dataset.stage = scene.exit > 0.45 ? "off" : scene.lineup > 0.6 ? "lineup" : scene.lineup > 0.12 ? "off" : "single"
    }
    measure()
    update()
    const resize = new ResizeObserver(() => {
      measure()
      update()
    })
    resize.observe(document.body)
    window.addEventListener("scroll", update, { passive: true })
    // Also catch up on the next frame whenever the scroll moved without an event reaching us in time
    // (the smooth scroller and a busy main thread can both delay one), so the page never sticks on a stale position
    let lastY = window.scrollY
    let lastTime = performance.now()
    let speed = 0
    let shown = 0
    let frame = requestAnimationFrame(function follow(now) {
      const dy = window.scrollY - lastY
      if (dy !== 0) {
        lastY = window.scrollY
        update()
      }
      // How fast the page is scrolling, for the rain, petals and type to react (not for reduced motion)
      if (page.dataset.motion !== undefined) {
        speed = followSpeed(speed, dy, (now - lastTime) / 1000)
        const amount = speedAmount(speed)
        motion.current.speed = amount
        if (Math.abs(amount - shown) > 0.002) {
          shown = amount
          page.style.setProperty("--speed", amount.toFixed(3))
        }
      }
      lastTime = now
      frame = requestAnimationFrame(follow)
    })
    return () => {
      resize.disconnect()
      window.removeEventListener("scroll", update)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Weighted, smooth scrolling and the text reveals, both left out for reduced motion
  useEffect(() => {
    const page = root.current
    if (reduced !== false || !page) return
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: 0 } })
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.shown = ""
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    for (const element of page.querySelectorAll(".klin-rise")) observer.observe(element)
    page.dataset.motion = ""
    return () => {
      lenis.destroy()
      observer.disconnect()
      delete page.dataset.motion
    }
  }, [reduced])

  return (
    <div ref={root} className="klin-root relative flex min-h-full flex-1 flex-col bg-[var(--klin-backdrop,#1b282d)] text-foreground" data-testid="klin-page">
      <KlinIntro ready={sceneReady || (reduced !== null && !webgl)} />
      <SkipLink label={t.skip} />
      <KlinHeader />
      {webgl && reduced !== null && (
        <SceneBoundary>
          <KlinScene state={state} still={reduced} size={size} spin={spin} motion={motion} onReady={() => setSceneReady(true)} />
        </SceneBoundary>
      )}

      {webgl && reduced !== null && <SpinZones board={spin} />}
      {webgl && reduced === false && <DropletCursor board={spin} />}
      <main id="main" className="relative z-10">
        <section
          ref={hero}
          id="top"
          aria-labelledby="klin-title"
          // On wide screens a fade of the page colour sits behind the text, so lightning and mist never wash it out
          className="relative isolate flex min-h-[100svh] items-end pt-24 pb-36 md:items-center md:pb-0 md:before:pointer-events-none md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:-z-10 md:before:w-[62%] md:before:bg-gradient-to-r md:before:from-[var(--klin-backdrop)]/85 md:before:via-[var(--klin-backdrop)]/55 md:before:to-transparent"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            {/* On phones the hero text sits over the storm's light; a fade of the page colour keeps it legible */}
            <div className="relative max-w-xl before:absolute before:-inset-x-5 before:-top-20 before:-bottom-24 before:-z-10 before:bg-gradient-to-t before:from-[var(--klin-backdrop)] before:via-[var(--klin-backdrop)]/85 before:to-transparent md:max-w-[52%] md:before:hidden">
              <p className="klin-rise text-sm text-muted-foreground">{t.tagline}</p>
              {/* No mask reveal here: the opening curtain reveals it, and its letters fall like rain as the hero scrolls away */}
              <h1
                id="klin-title"
                aria-label={t.hero.title}
                className={cn("mt-4 font-heading text-[clamp(3.25rem,9vw,8.75rem)] tracking-[-0.02em]", locale === "th" ? "leading-[1.15]" : "leading-[0.92]")}
              >
                <RainHeadline text={t.hero.title} locale={locale} />
              </h1>
              <p className="klin-rise mt-5 max-w-[46ch] leading-relaxed text-muted-foreground md:mt-6 md:text-lg" style={{ "--i": 2 } as React.CSSProperties}>
                {t.hero.body}
              </p>
              <a
                href="#monsoon"
                className="klin-rise mt-7 inline-flex h-12 items-center rounded-full border border-foreground/40 px-6 text-sm font-medium transition-colors hover:bg-foreground hover:text-background focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                {t.hero.cta}
              </a>
            </div>
          </div>
          <p className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-xs text-muted-foreground md:flex" aria-hidden="true">
            {t.hero.scroll}
            <span className="klin-scroll-cue block h-10 w-px bg-foreground/50" />
          </p>
        </section>

        <div id="scents">
          {scents.map((scent, index) => (
            <Chapter
              key={scent.id}
              scent={scent}
              index={index}
              ref={(element) => {
                chapters.current[index] = element
              }}
              onChoose={() => setChosen(scent.id)}
            />
          ))}
        </div>

        <section ref={collection} id="collection" aria-labelledby="collection-title" className="relative flex min-h-[100svh] flex-col justify-end pt-[54svh] pb-14">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <h2 id="collection-title" className="klin-rise font-heading text-5xl md:text-6xl">
              {t.collection.title}
            </h2>
            <p className="klin-rise mt-3 max-w-[52ch] text-muted-foreground">{t.collection.body}</p>
            <ul className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5">
              {scents.map((scent, index) => (
                <li
                  key={scent.id}
                  className="klin-rise flex items-end justify-between gap-4 border border-border bg-black/25 p-5 backdrop-blur-md md:flex-col md:items-start"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <div className="min-w-0">
                    <h3 className="font-heading text-3xl" style={{ color: scent.accent }}>
                      {scent.name[locale]}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{scent.moment[locale]}</p>
                    <p className="mt-3 text-sm tabular-nums">{t.collection.from(formatPrice(scent.sizes[0].price))}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChosen(scent.id)}
                    className="h-11 shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
                    aria-label={t.chapter.explore(scent.name[locale])}
                  >
                    {t.collection.choose}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="atelier" aria-labelledby="atelier-title" className="relative bg-[var(--klin-backdrop,#2a1a12)] py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 id="atelier-title" className="klin-rise font-heading text-5xl md:text-6xl">
                {t.atelier.title}
              </h2>
              <p className="klin-rise mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">{t.atelier.body}</p>
            </div>
            <dl className="klin-rise grid gap-6 self-end text-sm">
              <div>
                <dt className="text-muted-foreground">{t.atelier.address}</dt>
                <dd className="mt-1 text-base">{klin.atelier.address[locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.atelier.hours}</dt>
                <dd className="mt-1 text-base">{klin.atelier.hours[locale]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.atelier.contact}</dt>
                <dd className="mt-1 flex flex-col text-base">
                  <a className="w-fit underline-offset-4 hover:underline" href={`mailto:${klin.atelier.email}`}>
                    {klin.atelier.email}
                  </a>
                  <span>{klin.atelier.instagram}</span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border bg-[var(--klin-backdrop,#2a1a12)] py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-4 px-5 sm:px-8">
          <span className="font-heading text-2xl text-foreground" translate="no">
            {klin.name}
          </span>
          <span>{t.footer.rights(2026)}</span>
        </div>
      </footer>

      <ScentSheet
        scentId={chosen}
        onSize={(ml) => (size.current = { ...size.current, scent: chosen, ml })}
        onEngrave={(engraving) => (size.current = { ...size.current, scent: chosen, engraving })}
        onClose={() => {
          size.current = { scent: null, ml: 50, engraving: "" }
          setChosen(null)
        }}
      />
    </div>
  )
}

/**
 * The hero headline as letters kept in whole words (so lines still break
 * between words), each falling, drifting and fading by `--fall` (the hero's
 * scroll, 0–1) after its own delay; see .klin-fall in globals.css. Hidden from
 * assistive tech: the heading carries the text as its label.
 */
function RainHeadline({ text, locale }: { text: string; locale: string }) {
  const pieces = useMemo(() => headlinePieces(text, locale), [text, locale])
  return (
    <span aria-hidden="true" className="klin-fall">
      {pieces.map((piece, i) =>
        "space" in piece ? (
          <Fragment key={i}>{piece.space}</Fragment>
        ) : (
          <span key={i} className="klin-fall-word">
            {piece.word.map((letter, j) => (
              <span key={j} className="klin-fall-letter" style={{ "--d": letter.delay, "--s": letter.sway } as React.CSSProperties}>
                {letter.text}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  )
}

function Chapter({ scent, index, ref, onChoose }: { scent: Scent; index: number; ref: (element: HTMLElement | null) => void; onChoose: () => void }) {
  const locale = useLocale()
  const t = klinMessages[locale]
  return (
    <section ref={ref} id={scent.id} aria-labelledby={`${scent.id}-name`} className="relative min-h-[170svh]" data-testid="klin-chapter">
      <div className="sticky top-0 flex h-[100svh] items-end md:items-center">
        <div className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 md:pb-0">
          {/* On phones the text sits over the lower screen, on a fade of the page colour so it always reads */}
          <div className="klin-skew relative max-w-md before:absolute before:-inset-x-5 before:-top-16 before:-bottom-10 before:-z-10 before:bg-gradient-to-t before:from-[var(--klin-backdrop)] before:via-[var(--klin-backdrop)]/85 before:to-transparent md:max-w-lg md:before:hidden">
            <p className="klin-rise text-sm text-muted-foreground tabular-nums">{t.chapter.of(index + 1, scents.length)}</p>
            <h2
              id={`${scent.id}-name`}
              className={cn("klin-rise mt-2 font-heading text-[clamp(3rem,7vw,6.5rem)] tracking-[-0.015em]", locale === "th" ? "leading-[1.2]" : "leading-[0.95]")}
              style={{ color: scent.accent, "--i": 1 } as React.CSSProperties}
            >
              {scent.name[locale]}
            </h2>
            <p className="klin-rise mt-3 text-base" style={{ "--i": 2 } as React.CSSProperties}>
              {scent.moment[locale]}
            </p>
            <p className="klin-rise mt-4 leading-relaxed text-muted-foreground" style={{ "--i": 3 } as React.CSSProperties}>
              {scent.story[locale]}
            </p>
            <dl className="klin-rise mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm" style={{ "--i": 4 } as React.CSSProperties}>
              {(["top", "heart", "base"] as const).map((layer) => (
                <div key={layer}>
                  <dt className="text-muted-foreground">{t.chapter.notes[layer]}</dt>
                  {scent.notes[layer][locale].map((note) => (
                    <dd key={note} className="mt-1">
                      {note}
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={onChoose}
              className="klin-rise mt-7 inline-flex h-11 items-center rounded-full border border-current/40 px-5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              {t.chapter.explore(scent.name[locale])}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
