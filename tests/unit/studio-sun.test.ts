import { describe, expect, it } from "vitest"
import { projectSun, sunPath, sunPosition } from "@/features/studio/lib/sun"

const BANGKOK = 13.75

describe("sun positions for site plans", () => {
  it("puts the equinox noon sun due south, 90° minus the latitude up", () => {
    const noon = sunPosition(BANGKOK, 0, 12)
    expect(noon.azimuth).toBeCloseTo(180, 5)
    expect(noon.altitude).toBeCloseTo(90 - BANGKOK, 5)
  })

  it("puts the June noon sun to the north, both in Bangkok and further north in Chiang Dao", () => {
    const bangkok = sunPosition(BANGKOK, 23.44, 12)
    expect(bangkok.azimuth).toBeCloseTo(0, 5)
    expect(bangkok.altitude).toBeCloseTo(90 - (23.44 - BANGKOK), 5)
    const chiangDao = sunPosition(19.37, 23.44, 12)
    expect(chiangDao.azimuth).toBeCloseTo(0, 5)
    expect(chiangDao.altitude).toBeGreaterThan(85)
  })

  it("rises in the east and sets in the west at the equinox, and is lowest in December", () => {
    const morning = sunPosition(BANGKOK, 0, 6)
    const evening = sunPosition(BANGKOK, 0, 18)
    expect(morning.azimuth).toBeCloseTo(90, 0)
    expect(evening.azimuth).toBeCloseTo(270, 0)
    expect(morning.altitude).toBeCloseTo(0, 5)
    expect(sunPosition(BANGKOK, -23.44, 12).altitude).toBeCloseTo(90 - BANGKOK - 23.44, 5)
  })

  it("traces only the daylight part of the path", () => {
    const path = sunPath(BANGKOK, 0)
    expect(path.every((p) => p.altitude >= 0)).toBe(true)
    expect(path[0].hour).toBeGreaterThanOrEqual(6)
    expect(path.at(-1)!.hour).toBeLessThanOrEqual(18)
  })

  it("draws north up, east right and overhead in the middle", () => {
    expect(projectSun({ altitude: 0, azimuth: 0 }, 100, 100, 50)).toEqual([100, 50])
    const [eastX, eastY] = projectSun({ altitude: 0, azimuth: 90 }, 100, 100, 50)
    expect(eastX).toBeCloseTo(150)
    expect(eastY).toBeCloseTo(100)
    expect(projectSun({ altitude: 90, azimuth: 123 }, 100, 100, 50)).toEqual([100, 100])
  })
})

describe("project sites", async () => {
  const { BAY, FRONTAGES, projects } = await import("@/features/studio/data/projects")

  it("puts every house inside its plot, facing a real compass bearing, in Thailand", () => {
    for (const project of projects) {
      const { latitude, facing, plot, frontage } = project.site
      expect(project.bays * BAY, project.id).toBeLessThanOrEqual(plot[0])
      expect(project.depth, project.id).toBeLessThan(plot[1])
      expect(facing).toBeGreaterThanOrEqual(0)
      expect(facing).toBeLessThan(360)
      expect(latitude).toBeGreaterThan(5.5)
      expect(latitude).toBeLessThan(20.5)
      expect(FRONTAGES).toContain(frontage)
    }
  })

  it("faces Ari House west, as its louvres say", () => {
    expect(projects.find((project) => project.id === "ari-house")?.site.facing).toBe(270)
  })
})

describe("upper floors", async () => {
  const { projects } = await import("@/features/studio/data/projects")
  const { floorRooms } = await import("@/features/studio/components/project-drawing")
  const stairBay = (rooms: { room: string; bays: number }[]) => {
    let bay = 0
    for (const { room, bays } of rooms) {
      if (room === "stair") return bay
      bay += bays
    }
    return -1
  }

  it("draws a plan for every storey, each spanning the full width", () => {
    for (const project of projects) {
      const floors = [project.rooms, ...(project.upper ?? [])]
      expect(floors, project.id).toHaveLength(project.storeys)
      for (const rooms of floors) expect(rooms.reduce((sum, { bays }) => sum + bays, 0), project.id).toBe(project.bays)
    }
  })

  it("keeps the stair in the same bay all the way up", () => {
    for (const project of projects.filter((entry) => entry.storeys > 1)) {
      const bays = [project.rooms, ...(project.upper ?? [])].map(stairBay)
      expect(bays[0], project.id).toBeGreaterThanOrEqual(0)
      expect(new Set(bays).size, project.id).toBe(1)
    }
  })

  it("opens the upstairs over Ari House's courtyard and Hua Hin's pool", () => {
    const ari = projects.find((project) => project.id === "ari-house")!
    expect(floorRooms(ari, 2).map(({ room }) => room)).toContain("void")
    expect(floorRooms(ari, 1)).toBe(ari.rooms)
    expect(floorRooms(ari, 9)).toBe(ari.rooms)
    const huaHin = projects.find((project) => project.id === "hua-hin-beach-house")!
    expect(floorRooms(huaHin, 2)[0]).toEqual({ room: "void", bays: 2 })
    expect(huaHin.rooms[0]).toEqual({ room: "pool", bays: 2 })
  })
})

describe("light wells", async () => {
  const { projects } = await import("@/features/studio/data/projects")

  it("sit inside the plan, at the back of a real bay", () => {
    const withWells = projects.filter((project) => project.lightWell)
    expect(withWells.map((project) => project.id)).toEqual(["talat-noi-shophouse"])
    for (const project of withWells) {
      const { bay, depth } = project.lightWell!
      expect(bay).toBeGreaterThanOrEqual(0)
      expect(bay).toBeLessThan(project.bays)
      expect(depth).toBeGreaterThan(1)
      expect(depth).toBeLessThan(project.depth / 3)
    }
  })
})
