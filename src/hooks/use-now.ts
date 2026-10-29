"use client"

import { useSyncExternalStore } from "react"

let cached: Date | null = null

function read(): Date {
  const now = new Date()
  // Keep the same object within a minute so subscribers don't re-render every call.
  if (!cached || Math.floor(cached.getTime() / 60_000) !== Math.floor(now.getTime() / 60_000)) cached = now
  return cached
}

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000)
  return () => window.clearInterval(id)
}

/** The current time, refreshed every 30 s; null on the server and during hydration. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, read, () => null)
}
