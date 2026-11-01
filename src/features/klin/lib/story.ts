import { scents, type Scent } from "../data/scents"

/** "#1b282d" → [27, 40, 45] */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rgbToHex([r, g, b]: readonly number[]): string {
  return `#${[r, g, b].map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, "0")).join("")}`
}

/** Straight blend between two colours, t from 0 to 1. */
export function mixHex(from: string, to: string, t: number): string {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const k = clamp01(t)
  return rgbToHex(a.map((channel, i) => channel + (b[i] - channel) * k))
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Eases both ends, so colour and turn changes settle instead of snapping. */
export function smoothstep(t: number): number {
  const k = clamp01(t)
  return k * k * (3 - 2 * k)
}

export interface SceneState {
  /** Which scent the page is on, and how far it is through the handover to the next. */
  scent: Scent
  next: Scent
  blend: number
  backdrop: string
  liquid: string
  accent: string
  /** Turns of the bottle around its upright axis, in radians. */
  turn: number
  /** 0–1 strength of each atmosphere. */
  rain: number
  petals: number
  embers: number
  /** How far the camera has pulled back for the collection line-up, 0–1. */
  lineup: number
  /** Screens scrolled past the collection, so the line-up can leave with it. */
  exit: number
  /** The hero's storm (lightning, mist), fading as the hero scrolls away, 0–1. */
  storm: number
  /** How much of each floor shows under the bottle: none in the storm, then each chapter's own. */
  stone: number
  lacquer: number
  wood: number
}

export interface StoryPosition {
  /** How far the hero has scrolled away, 0–1. */
  hero: number
  /** Where the reader is among the scent chapters: 0 is the first scent, 1 the second, and so on; fractions are part-way through a handover. */
  chapter: number
  /** How far the collection has come into view, 0–1. */
  lineup: number
  /** Screens scrolled past the top of the collection (0 until it reaches the top). */
  exit?: number
}

/**
 * The page as one continuous scene. Each scent holds while its chapter is on
 * screen and blends into the next between chapters; the hero
 * is the first scent in a light drizzle; the collection pulls back to show all
 * three bottles. The bottle keeps turning one way the whole time.
 */
export function sceneAt({ hero, chapter, lineup, exit = 0 }: StoryPosition): SceneState {
  const position = Math.min(scents.length - 1, Math.max(0, chapter))
  const index = Math.min(scents.length - 2, Math.floor(position))
  const within = position - index
  const blend = smoothstep(within)
  const scent = scents[index]
  const next = scents[index + 1]
  const weight = (id: Scent["atmosphere"]) => (scent.atmosphere === id ? 1 - blend : 0) + (next.atmosphere === id ? blend : 0)
  const drizzle = 0.35 + 0.65 * smoothstep(hero)

  return {
    scent: blend < 0.5 ? scent : next,
    next,
    blend,
    backdrop: mixHex(scent.backdrop, next.backdrop, blend),
    liquid: mixHex(scent.liquid, next.liquid, blend),
    accent: mixHex(scent.accent, next.accent, blend),
    turn: (clamp01(hero) * 0.5 + position + clamp01(lineup) * 0.5) * Math.PI,
    rain: weight("rain") * drizzle,
    petals: weight("petals"),
    embers: weight("embers"),
    lineup: smoothstep(lineup),
    exit: Math.max(0, exit),
    storm: 1 - smoothstep(hero),
    stone: weight("rain") * smoothstep(hero),
    lacquer: weight("petals") * smoothstep(hero),
    wood: weight("embers") * smoothstep(hero),
  }
}

export interface SectionBox {
  top: number
  height: number
}

/**
 * Reads the story position off the page layout: the hero's height, each
 * chapter's box and the collection's top, all in document pixels. Chapters
 * pin their text for a screen (`position: sticky` inside a taller section), so
 * a scent holds while its text is pinned and hands over in the scroll between
 * one chapter's text letting go and the next one's pinning.
 */
export function storyPosition(scrollY: number, viewport: number, layout: { hero: SectionBox; chapters: SectionBox[]; collectionTop: number }): StoryPosition {
  let chapter = 0
  layout.chapters.forEach((box, i) => {
    if (scrollY < box.top) return
    const letGo = box.top + box.height - viewport
    chapter = i + clamp01((scrollY - letGo) / Math.max(1, viewport))
  })
  return {
    hero: clamp01(scrollY / Math.max(1, layout.hero.height)),
    chapter: Math.min(layout.chapters.length - 1, chapter),
    lineup: clamp01((scrollY + viewport - layout.collectionTop) / Math.max(1, viewport)),
    exit: Math.max(0, (scrollY - layout.collectionTop) / Math.max(1, viewport)),
  }
}

/** Formats prices the same on server and client: "฿2,900". */
export function formatPrice(baht: number): string {
  return `฿${String(Math.round(baht)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

/** Lightning behind cloud: a bright double flash and a faint one every 7.3 seconds, 0–1, dark in between. */
export function lightning(t: number): number {
  const k = ((t % 7.3) + 7.3) % 7.3
  const pulse = (at: number, width: number) => Math.max(0, 1 - Math.abs(k - at) / width)
  return Math.max(pulse(0.06, 0.06), pulse(0.24, 0.05) * 0.7, pulse(4.1, 0.05) * 0.45)
}

/** How much of the 3D scene a device gets: everything, the light scene, or still frames drawn on scroll. */
export type Tier = "full" | "light" | "still"

/**
 * Picks the next look from frame-rate readings (one per 1.5-second window).
 * The first reading is ignored (shaders compile then); two in a row decide.
 * Light → full needs a big screen and two readings over 45 fps; full → light
 * two under 30; light → still two under 15. Still is final.
 */
export function nextTier(tier: Tier, readings: readonly number[], canBeFull: boolean): Tier {
  const recent = readings.slice(1).slice(-2)
  if (recent.length < 2 || tier === "still") return tier
  if (tier === "light" && canBeFull && recent.every((fps) => fps > 45)) return "full"
  if (tier === "full" && recent.every((fps) => fps < 30)) return "light"
  if (tier === "light" && recent.every((fps) => fps < 15)) return "still"
  return tier
}
