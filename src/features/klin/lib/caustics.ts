import type { SceneState } from "./story"

/** How much light each floor shows: black lacquer is nearly unseen, so light on it would seem to float. */
const LACQUER = 0.45

/**
 * How bright the light thrown through the glass onto the floor is (0–1): only
 * when the bottle stands on a floor (stone and wood fully, black lacquer
 * faintly), not while it floats in the storm or once the three line up.
 */
export function causticStrength(s: Pick<SceneState, "stone" | "lacquer" | "wood" | "storm" | "lineup">): number {
  const floor = Math.min(1, s.stone + s.lacquer * LACQUER + s.wood)
  return Math.max(0, Math.min(1, floor * (1 - s.storm) * (1 - s.lineup)))
}
