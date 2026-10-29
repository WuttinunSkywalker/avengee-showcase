import type { Product } from "../data/products"
import type { Grind } from "./cart"

export interface BrewRecipe {
  method: Grind
  /** Coffee : water, e.g. 15 means 1:15. For espresso this is the yield ratio (1:2). */
  ratio: number
  doseGrams: number
  waterGrams: number
  temperature: number
  /** Total brew time in seconds. */
  seconds: number
}

/** The recipe the roastery suggests on the back of the bag, tuned to roast level. */
export function recipeFor(product: Product): BrewRecipe {
  if (product.roast >= 4) {
    return { method: "espresso", ratio: 2, doseGrams: 18, waterGrams: 36, temperature: 92, seconds: 28 }
  }
  const light = product.roast <= 2
  return {
    method: "pour-over",
    ratio: light ? 16 : 15,
    doseGrams: 15,
    waterGrams: light ? 240 : 225,
    temperature: light ? 94 : 91,
    seconds: light ? 180 : 165,
  }
}

/** 165 → "2:45" */
export function formatBrewTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}
