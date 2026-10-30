/**
 * Where the sun is, for site plans. Solar time, declination for the three
 * dates architects draw (both solstices and the equinoxes), and the usual
 * spherical-astronomy formulas. Angles in degrees; azimuth clockwise from north.
 */

const rad = (degrees: number) => (degrees * Math.PI) / 180
const deg = (radians: number) => (radians * 180) / Math.PI

export const SUN_DATES = [
  { id: "june", declination: 23.44 },
  { id: "equinox", declination: 0 },
  { id: "december", declination: -23.44 },
] as const
export type SunDate = (typeof SUN_DATES)[number]["id"]

export interface SunPosition {
  hour: number
  altitude: number
  azimuth: number
}

export function sunPosition(latitude: number, declination: number, hour: number): SunPosition {
  const phi = rad(latitude)
  const delta = rad(declination)
  const h = rad(15 * (hour - 12))
  const altitude = deg(Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h)))
  // Measured from south, positive towards the west; turned round to read from north
  const fromSouth = deg(Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi)))
  return { hour, altitude, azimuth: (fromSouth + 180 + 360) % 360 }
}

/** The sun's track across the sky on one date, every quarter hour while it's up. */
export function sunPath(latitude: number, declination: number, step = 0.25): SunPosition[] {
  const path: SunPosition[] = []
  for (let hour = 5; hour <= 19 + 1e-9; hour += step) {
    const position = sunPosition(latitude, declination, hour)
    if (position.altitude >= 0) path.push(position)
  }
  return path
}

/**
 * Onto a flat sun-path diagram: the horizon is the outer circle, overhead is
 * the centre, north is up.
 */
export function projectSun(position: Pick<SunPosition, "altitude" | "azimuth">, cx: number, cy: number, radius: number): [number, number] {
  const r = (radius * (90 - position.altitude)) / 90
  return [cx + r * Math.sin(rad(position.azimuth)), cy - r * Math.cos(rad(position.azimuth))]
}
