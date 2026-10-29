"use client"

import { useEffect } from "react"

interface PersistApi {
  getOptions: () => { name?: string }
  rehydrate: () => Promise<void> | void
}

/**
 * Re-reads a localStorage-backed zustand store whenever another tab writes
 * to it, so two screens open side by side (a table and the kitchen) stay in step.
 */
export function useStorageSync(persist: PersistApi) {
  useEffect(() => {
    const name = persist.getOptions().name
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === name) void persist.rehydrate()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [persist])
}
