"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addToCart, removeLine, setQuantity, type CartItem } from "../lib/cart"

interface CartState {
  items: CartItem[]
  /** Applied promo code, re-validated against the cart whenever totals are computed. */
  promoCode: string | null
  open: boolean
  add: (item: CartItem) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  setPromoCode: (code: string | null) => void
  setOpen: (open: boolean) => void
}

/** The guest's cart, kept in localStorage so it survives reloads and new tabs. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      open: false,
      add: (item) => set((state) => ({ items: addToCart(state.items, item) })),
      setQuantity: (key, quantity) => set((state) => ({ items: setQuantity(state.items, key, quantity) })),
      remove: (key) => set((state) => ({ items: removeLine(state.items, key) })),
      clear: () => set({ items: [], promoCode: null }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "kaffa:cart:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ items, promoCode }) => ({ items, promoCode }),
    },
  ),
)
