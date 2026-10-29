import type { CSSProperties } from "react"

/** Position in a staggered sequence, read by the `.intro`, `.reveal` and `.reveal-rule` animations in globals.css. */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties
}
