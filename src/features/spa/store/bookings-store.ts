"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Booking, BookingStatus } from "../lib/types"

interface BookingsState {
  /** Bookings made by the visitor through the booking flow. */
  created: Booking[]
  /** Status changes made in the admin, keyed by booking id. */
  overrides: Record<string, BookingStatus>
  addBooking: (booking: Booking) => void
  setStatus: (id: string, status: BookingStatus) => void
  reset: () => void
}

export const BOOKINGS_STORAGE_KEY = "baan-lamai:bookings:v1"

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set) => ({
      created: [],
      overrides: {},
      addBooking: (booking) => set((state) => ({ created: [...state.created, booking] })),
      setStatus: (id, status) =>
        set((state) => {
          if (state.created.some((booking) => booking.id === id)) {
            return {
              created: state.created.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
            }
          }
          return { overrides: { ...state.overrides, [id]: status } }
        }),
      reset: () => set({ created: [], overrides: {} }),
    }),
    {
      name: BOOKINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ created, overrides }) => ({ created, overrides }),
    },
  ),
)

/** Applies admin status overrides and appends visitor bookings to the seed data. */
export function mergeBookings(seed: readonly Booking[], created: readonly Booking[], overrides: Record<string, BookingStatus>): Booking[] {
  const merged = seed.map((booking) => (overrides[booking.id] ? { ...booking, status: overrides[booking.id] } : booking))
  return [...merged, ...created].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
}
