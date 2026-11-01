/**
 * Outline of the Klin flacon as [radius, height] pairs from the base up, in
 * scene units, turned around the upright axis to make the glass. A heavy
 * rounded base, straight sides, sloping shoulders and a short neck.
 */
export function bottleProfile(): [number, number][] {
  return [
    [0, 0],
    [0.62, 0],
    [0.71, 0.03],
    [0.75, 0.12],
    [0.77, 0.4],
    [0.77, 1.08],
    [0.74, 1.3],
    [0.62, 1.48],
    [0.4, 1.62],
    [0.21, 1.7],
    [0.19, 1.76],
    [0.19, 1.86],
    [0, 1.86],
  ]
}

/** The juice: a little inside the glass walls, above the thick base, filled to the shoulders. */
export function liquidProfile(fill = 1.18): [number, number][] {
  return [
    [0, 0.16],
    [0.6, 0.16],
    [0.67, 0.22],
    [0.69, 0.4],
    [0.69, fill],
    [0, fill],
  ]
}

/** Widest radius of an outline. */
export function maxRadius(profile: readonly [number, number][]): number {
  return Math.max(...profile.map(([radius]) => radius))
}

/**
 * The flacon's outline as a flat SVG path, mirrored about the centre line, in
 * a viewBox of `-1 -2 2 2.05` (y up becomes y down). Used for the bottle drawn
 * in the scent sheet.
 */
export function bottleSilhouette(profile: readonly [number, number][] = bottleProfile()): string {
  const right = profile.filter(([radius]) => radius > 0).map(([x, y]) => `${x.toFixed(3)} ${(-y).toFixed(3)}`)
  const left = [...profile]
    .reverse()
    .filter(([radius]) => radius > 0)
    .map(([x, y]) => `${(-x).toFixed(3)} ${(-y).toFixed(3)}`)
  return `M0 0 L${right.join(" L")} L${left.join(" L")} Z`
}
