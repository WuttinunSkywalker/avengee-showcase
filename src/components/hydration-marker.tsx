"use client"

import { useEffect } from "react"

/** Sets data-hydrated on <html> once React has hydrated; e2e tests wait for it before interacting. */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = ""
  }, [])
  return null
}
