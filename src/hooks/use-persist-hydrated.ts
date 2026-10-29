"use client"

import { useEffect, useSyncExternalStore } from "react"

interface PersistApi {
  hasHydrated: () => boolean
  onFinishHydration: (listener: () => void) => () => void
  rehydrate: () => Promise<void> | void
}

/** Subscribes to a zustand persist store and kicks off hydration from storage once. */
export function usePersistHydrated(persist: PersistApi): boolean {
  const hydrated = useSyncExternalStore(
    (onChange) => persist.onFinishHydration(onChange),
    () => persist.hasHydrated(),
    () => false,
  )
  useEffect(() => {
    if (!persist.hasHydrated()) void persist.rehydrate()
  }, [persist])
  return hydrated
}
