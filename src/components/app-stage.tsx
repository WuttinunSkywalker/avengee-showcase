import { ViewTransition, type ReactNode } from "react"

/** The name an app's page and its card on the portal share, e.g. "app-spa" for /spa. */
export function appStageName(slug: string): string {
  return `app-${slug}`
}

/** The id of an app's card on the portal, e.g. "showcase-spa", so the way back from the app can land on it. */
export function cardAnchor(slug: string): string {
  return `showcase-${slug}`
}

/** The app an in-app path belongs to: "/th/spa/book" → "spa". */
export function appSlug(pathname: string): string | undefined {
  return pathname.split("/")[2] || undefined
}

/**
 * Marks an app's whole page, or its screen on a portal card, as the same
 * thing seen twice: opening the app from the card grows the card's screen
 * into the page (and going back shrinks it into the card), as a view
 * transition. Still for reduced motion (see globals.css).
 */
export function AppStage({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <ViewTransition name={appStageName(slug)} share="app-morph" default="none">
      {children}
    </ViewTransition>
  )
}
