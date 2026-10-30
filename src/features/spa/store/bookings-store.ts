"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { moveBooking, type Move } from "../lib/manage"
import type { Booking, BookingStatus } from "../lib/types"

interface BookingsState {
  /** Bookings made by the visitor through the booking flow. */
  created: Booking[]
  /** Status changes made in the admin, keyed by booking id. */
  overrides: Record<string, BookingStatus>
  /** New times guests chose from the manage page, keyed by booking id. */
  moved: Record<string, Move>
  addBooking: (booking: Booking) => void
  setStatus: (id: string, status: BookingStatus) => void
  move: (id: string, move: Move) => void
  /** The guest cancels online; with `refunded`, their deposit goes back. */
  cancelByGuest: (id: string, refunded: boolean) => void
  reset: () => void
}

export const BOOKINGS_STORAGE_KEY = "baan-lamai:bookings:v1"

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set) => ({
      created: [],
      overrides: {},
      moved: {},
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
      move: (id, move) =>
        set((state) =>
          state.created.some((booking) => booking.id === id)
            ? { created: state.created.map((booking) => (booking.id === id ? moveBooking(booking, move) : booking)) }
            : { moved: { ...state.moved, [id]: move } },
        ),
      cancelByGuest: (id, refunded) =>
        set((state) =>
          state.created.some((booking) => booking.id === id)
            ? {
                created: state.created.map((booking) =>
                  booking.id === id
                    ? { ...booking, status: "cancelled" as const, payment: refunded && booking.payment.amountPaid > 0 ? { ...booking.payment, status: "refunded" as const } : booking.payment }
                    : booking,
                ),
              }
            : { overrides: { ...state.overrides, [id]: "cancelled" as const } },
        ),
      reset: () => set({ created: [], overrides: {}, moved: {} }),
    }),
    {
      name: BOOKINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ created, overrides, moved }) => ({ created, overrides, moved }),
    },
  ),
)

/** Applies admin status overrides and guests' new times, and appends visitor bookings to the seed data. */
export function mergeBookings(seed: readonly Booking[], created: readonly Booking[], overrides: Record<string, BookingStatus>, moved: Record<string, Move> = {}): Booking[] {
  const merged = seed.map((booking) => {
    const withTime = moved[booking.id] ? moveBooking(booking, moved[booking.id]) : booking
    return overrides[booking.id] ? { ...withTime, status: overrides[booking.id] } : withTime
  })
  return [...merged, ...created].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
}
