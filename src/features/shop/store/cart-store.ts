"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Product } from "../data/products"
import { addToCart, fitToStock, removeLine, setQuantity, type CartItem } from "../lib/cart"

interface CartState {
  items: CartItem[]
  /** Applied promo code, re-validated against the cart whenever totals are computed. */
  promoCode: string | null
  open: boolean
  /** `stock` is the live catalogue to check against; defaults to the printed stock. */
  add: (item: CartItem, stock?: readonly Product[]) => void
  setQuantity: (key: string, quantity: number, stock?: readonly Product[]) => void
  remove: (key: string) => void
  /** Trims the cart to live stock. */
  fitToStock: (stock: readonly Product[]) => void
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
      add: (item, stock) => set((state) => ({ items: addToCart(state.items, item, stock) })),
      setQuantity: (key, quantity, stock) => set((state) => ({ items: setQuantity(state.items, key, quantity, stock) })),
      remove: (key) => set((state) => ({ items: removeLine(state.items, key) })),
      fitToStock: (stock) => set((state) => ({ items: fitToStock(state.items, stock) })),
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
