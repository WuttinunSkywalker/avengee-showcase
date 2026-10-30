"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Enquiry, EnquiryStatus, StatusChange } from "../lib/inbox"

interface InboxState {
  /** Enquiries sent from this browser's contact form. */
  mine: Enquiry[]
  /** What the studio has done with each enquiry, by reference. */
  changes: Record<string, StatusChange>
  add: (enquiry: Enquiry) => void
  setStatus: (reference: string, status: EnquiryStatus, visitOn?: string) => void
}

/** The studio inbox, in localStorage so an enquiry sent in one tab shows up in the inbox in another. */
export const useInboxStore = create<InboxState>()(
  persist(
    (set) => ({
      mine: [],
      changes: {},
      add: (enquiry) => set((state) => ({ mine: [enquiry, ...state.mine] })),
      setStatus: (reference, status, visitOn) => set((state) => ({ changes: { ...state.changes, [reference]: visitOn ? { status, visitOn } : { status } } })),
    }),
    { name: "sorn:inbox:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
