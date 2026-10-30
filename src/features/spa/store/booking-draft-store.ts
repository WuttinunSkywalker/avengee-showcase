"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { getAddOn } from "../data/services"
import type { TherapistPreference } from "../lib/availability"
import type { ISODate } from "../lib/time"

export type PaymentChoice = "promptpay" | "pay-at-spa"

export interface GuestDraft {
  name: string
  email: string
  phone: string
  notes: string
  acceptPolicy: boolean
}

export interface BookingDraft {
  serviceId: string | null
  minutes: number | null
  addOnIds: string[]
  therapist: TherapistPreference
  date: ISODate | null
  start: number | null
  guest: GuestDraft
  promoCode: string | null
  /** Gift voucher code the guest entered at payment, already normalised. */
  voucherCode: string | null
  payment: PaymentChoice
}

interface DraftActions {
  selectService: (serviceId: string, minutes: number) => void
  setMinutes: (minutes: number) => void
  toggleAddOn: (addOnId: string) => void
  setTherapist: (therapist: TherapistPreference) => void
  setDate: (date: ISODate) => void
  setStart: (start: number | null) => void
  setGuest: (guest: GuestDraft) => void
  setPromoCode: (code: string | null) => void
  setVoucherCode: (code: string | null) => void
  setPayment: (payment: PaymentChoice) => void
  reset: () => void
}

export const emptyGuest: GuestDraft = { name: "", email: "", phone: "", notes: "", acceptPolicy: false }

export const initialDraft: BookingDraft = {
  serviceId: null,
  minutes: null,
  addOnIds: [],
  therapist: "any",
  date: null,
  start: null,
  guest: emptyGuest,
  promoCode: null,
  voucherCode: null,
  payment: "promptpay",
}

/**
 * The in-progress booking. Kept in sessionStorage so a refresh or a quick
 * look at another page does not lose the guest's choices.
 */
export const useBookingDraft = create<BookingDraft & DraftActions>()(
  persist(
    (set) => ({
      ...initialDraft,
      // Changing the treatment invalidates the chosen time (durations differ).
      selectService: (serviceId, minutes) =>
        set((state) => (state.serviceId === serviceId && state.minutes === minutes ? state : { serviceId, minutes, start: null })),
      setMinutes: (minutes) => set((state) => (state.minutes === minutes ? state : { minutes, start: null })),
      // Add-ons that lengthen the treatment invalidate the chosen time.
      toggleAddOn: (addOnId) =>
        set((state) => ({
          addOnIds: state.addOnIds.includes(addOnId)
            ? state.addOnIds.filter((id) => id !== addOnId)
            : [...state.addOnIds, addOnId],
          start: (getAddOn(addOnId)?.minutes ?? 0) > 0 ? null : state.start,
        })),
      setTherapist: (therapist) => set((state) => (state.therapist === therapist ? state : { therapist, start: null })),
      setDate: (date) => set((state) => (state.date === date ? state : { date, start: null })),
      setStart: (start) => set({ start }),
      setGuest: (guest) => set({ guest }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setVoucherCode: (voucherCode) => set({ voucherCode }),
      setPayment: (payment) => set({ payment }),
      reset: () => set(initialDraft),
    }),
    {
      name: "baan-lamai:draft:v1",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      skipHydration: true,
    },
  ),
)
