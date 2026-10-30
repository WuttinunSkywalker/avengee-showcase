"use client"

import { useMemo, useSyncExternalStore } from "react"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useShallow } from "zustand/react/shallow"
import { generateSeedBookings } from "../lib/seed"
import { toSpaTime, type ZonedNow } from "../lib/time"
import type { Booking } from "../lib/types"
import { mergeBookings, useBookingsStore } from "../store/bookings-store"

const REFRESH_MS = 30_000

let cachedNow: ZonedNow | null = null

function readNow(): ZonedNow {
  const next = toSpaTime(new Date())
  if (!cachedNow || cachedNow.date !== next.date || cachedNow.minutes !== next.minutes) cachedNow = next
  return cachedNow
}

function subscribeToClock(onChange: () => void) {
  const id = window.setInterval(onChange, REFRESH_MS)
  return () => window.clearInterval(id)
}

/**
 * Current spa-local time, or null during server render and hydration.
 * Gating time-based UI on null avoids hydration mismatches.
 */
export function useSpaNow(): ZonedNow | null {
  return useSyncExternalStore(subscribeToClock, readNow, () => null)
}

export { usePersistHydrated }

/** Loads persisted bookings from localStorage once per page. */
export function useHydrateBookings(): boolean {
  return usePersistHydrated(useBookingsStore.persist)
}

export type SpaData = { ready: false; now: null; bookings: Booking[] } | { ready: true; now: ZonedNow; bookings: Booking[] }

const NOT_READY: SpaData = { ready: false, now: null, bookings: [] }

/** Seeded history merged with visitor bookings and admin edits. */
export function useSpaData(): SpaData {
  const now = useSpaNow()
  const hydrated = useHydrateBookings()
  const { created, overrides, moved } = useBookingsStore(
    useShallow((state) => ({ created: state.created, overrides: state.overrides, moved: state.moved })),
  )

  // Statuses for "today" depend on the time, so the seed refreshes in 5-minute buckets.
  const bucket = now ? `${now.date}:${Math.floor(now.minutes / 5)}` : null
  const seed = useMemo(() => (bucket ? generateSeedBookings({ now: toSpaTime(new Date()) }) : []), [bucket])
  const bookings = useMemo(() => mergeBookings(seed, created, overrides, moved), [seed, created, overrides, moved])

  return useMemo(() => (now && hydrated ? { ready: true, now, bookings } : NOT_READY), [now, hydrated, bookings])
}
