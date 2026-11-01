import { showcases } from "@/config/site"
import type { Locale } from "@/i18n/config"

/**
 * The app screen that floats beside each service in "What we build", in the
 * services' order: one of a showcase's tour screens, or its home page.
 */
const PREVIEWS: { app: string; tour?: number }[] = [
  // Booking systems: Baan Lamai's booking flow
  { app: "baan-lamai", tour: 0 },
  // Online shops: a Kaffa Roasters product page
  { app: "shop", tour: 0 },
  // Business websites: Sorn Studio's home page
  { app: "landing" },
  // Care after launch: a staff dashboard, the part a business lives in day to day
  { app: "shop", tour: 1 },
]

export interface ServicePreview {
  src: string
  /** "App: screen", shown under the picture. */
  label: string
}

/** The screen for the service at `index`, or null if it has none. `homeLabel` names an app's home page. */
export function servicePreview(index: number, locale: Locale, homeLabel: string): ServicePreview | null {
  const pick = PREVIEWS[index]
  const showcase = pick && showcases.find((item) => item.id === pick.app)
  const images = showcase?.images
  if (!showcase || !images) return null
  if (pick.tour === undefined) return { src: images.desktop[locale], label: `${showcase.name}: ${homeLabel}` }
  const screen = images.tour?.[pick.tour]
  return screen ? { src: screen.src[locale], label: `${showcase.name}: ${screen.label[locale]}` } : null
}

/** Where the floating preview's top sits as the pointer moves down the list: centred on the pointer, kept within the list. */
export function previewTop(pointerY: number, listHeight: number, cardHeight: number): number {
  return Math.max(0, Math.min(listHeight - cardHeight, pointerY - cardHeight / 2))
}

/** How far the preview tips as it glides, in degrees: with its speed (px per frame), never more than a few degrees. */
export function previewTilt(velocity: number): number {
  return Math.max(-7, Math.min(7, velocity * 0.35))
}
