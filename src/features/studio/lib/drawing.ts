import { BAY, STOREY, type Project, type Roof } from "../data/projects"

/** Drawing sheet, in SVG units. Everything is laid out on a 480×300 sheet with the ground line near the bottom. */
export const SHEET = { width: 480, height: 300, ground: 246, margin: 24 } as const

/** Roof eaves reach this far past the walls, in metres. Deep eaves are the point in the tropics. */
export const EAVE = 1.2

const roofRise: Record<Roof, (widthM: number) => number> = {
  flat: () => 0.45,
  gable: (w) => Math.min(w * 0.32, 4.2),
  shed: (w) => Math.min(w * 0.16, 2.4),
  butterfly: (w) => Math.min(w * 0.12, 1.6),
}

export interface ElevationLayout {
  /** SVG units per metre. */
  scale: number
  x: number
  w: number
  /** Top of the walls. */
  top: number
  ground: number
  floor: number
  eave: number
  rise: number
  widthM: number
  wallM: number
}

/** Fits the building, its eaves and roof onto the sheet at one scale. */
export function elevationLayout(project: Pick<Project, "bays" | "storeys" | "roof">): ElevationLayout {
  const widthM = project.bays * BAY
  const wallM = project.storeys * STOREY
  const riseM = roofRise[project.roof](widthM)
  const available = { w: SHEET.width - SHEET.margin * 2 - 70, h: SHEET.ground - SHEET.margin - 30 }
  const scale = Math.min(available.w / (widthM + EAVE * 2), available.h / (wallM + riseM), 18)
  const w = widthM * scale
  return {
    scale,
    x: (SHEET.width - w) / 2,
    w,
    top: SHEET.ground - wallM * scale,
    ground: SHEET.ground,
    floor: STOREY * scale,
    eave: EAVE * scale,
    rise: riseM * scale,
    widthM,
    wallM,
  }
}

/** The roof as a closed polygon, from the left eave round to the right. */
export function roofPolygon(roof: Roof, l: ElevationLayout): [number, number][] {
  const left = l.x - l.eave
  const right = l.x + l.w + l.eave
  const thick = Math.max(3, 0.3 * l.scale)
  switch (roof) {
    case "gable":
      return [
        [left, l.top + thick * 0.4],
        [l.x + l.w / 2, l.top - l.rise],
        [right, l.top + thick * 0.4],
        [right, l.top + thick * 1.4],
        [l.x + l.w / 2, l.top - l.rise + thick],
        [left, l.top + thick * 1.4],
      ]
    case "shed":
      return [
        [left, l.top],
        [right, l.top - l.rise],
        [right, l.top - l.rise + thick],
        [left, l.top + thick],
      ]
    case "butterfly":
      return [
        [left, l.top - l.rise],
        [l.x + l.w / 2, l.top],
        [right, l.top - l.rise],
        [right, l.top - l.rise + thick],
        [l.x + l.w / 2, l.top + thick],
        [left, l.top - l.rise + thick],
      ]
    default:
      return [
        [left, l.top - l.rise],
        [right, l.top - l.rise],
        [right, l.top + thick - l.rise],
        [left, l.top + thick - l.rise],
      ]
  }
}

/** Trees either side of the building, alternating, sized like real canopies (6–9 m). */
export function treeSpots(count: number, l: ElevationLayout): { x: number; r: number }[] {
  const spots: { x: number; r: number }[] = []
  for (let i = 0; i < count; i++) {
    const leftSide = i % 2 === 0
    const step = Math.floor(i / 2)
    const r = (3 + ((i * 7) % 3) * 0.6) * l.scale * 0.55
    const gap = l.eave + r * 0.6 + step * r * 1.6
    const x = leftSide ? l.x - gap : l.x + l.w + gap
    spots.push({ x: Math.min(SHEET.width - 12 - r * 0.5, Math.max(12 + r * 0.5, x)), r })
  }
  return spots
}

export interface PlanLayout {
  scale: number
  x: number
  y: number
  w: number
  d: number
  rooms: { room: Project["rooms"][number]["room"]; x: number; w: number }[]
}

/** The ground-floor plan: rooms side by side across the bays, at the depth of the house. */
export function planLayout(project: Pick<Project, "bays" | "depth" | "rooms">): PlanLayout {
  const widthM = project.bays * BAY
  const scale = Math.min((SHEET.width - SHEET.margin * 2 - 40) / widthM, (SHEET.height - SHEET.margin * 2 - 40) / project.depth)
  const w = widthM * scale
  const d = project.depth * scale
  const x = (SHEET.width - w) / 2
  const y = (SHEET.height - d) / 2 - 6
  let cursor = x
  const rooms = project.rooms.map(({ room, bays }) => {
    const roomW = bays * BAY * scale
    const placed = { room, x: cursor, w: roomW }
    cursor += roomW
    return placed
  })
  return { scale, x, y, w, d, rooms }
}

/** Formats a length in metres the way it's written on drawings: one decimal, e.g. "15.0 m". */
export function metres(value: number): string {
  return `${value.toFixed(1)} m`
}
