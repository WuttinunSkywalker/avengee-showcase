import { describe, expect, it } from "vitest"
import { BAY, getProject, projects, ROOMS } from "@/features/studio/data/projects"
import { studioMessages } from "@/features/studio/i18n/messages"
import { elevationLayout, metres, planLayout, roofPolygon, SHEET, treeSpots } from "@/features/studio/lib/drawing"

describe("Sorn Studio projects", () => {
  it("have unique ids and complete Thai copy", () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length)
    for (const project of projects) {
      expect(project.name.th, project.id).toMatch(/[฀-๿]/)
      expect(project.location.th, project.id).toMatch(/[฀-๿]/)
      expect(project.summary.th, project.id).toMatch(/[฀-๿]/)
      for (const note of project.notes) expect(note.th).toMatch(/[฀-๿]/)
    }
    expect(getProject("ari-house")?.name.en).toBe("Ari House")
    expect(getProject("nope")).toBeUndefined()
  })

  it("lay out rooms that span exactly the bays, with plausible areas", () => {
    for (const project of projects) {
      expect(project.rooms.reduce((sum, r) => sum + r.bays, 0), project.id).toBe(project.bays)
      for (const { room } of project.rooms) expect(ROOMS).toContain(room)
      // Built area is at least the ground floor and no more than every floor of the footprint
      const footprint = project.bays * BAY * project.depth
      expect(project.area, project.id).toBeGreaterThanOrEqual(footprint * 0.6)
      expect(project.area, project.id).toBeLessThanOrEqual(footprint * project.storeys)
    }
  })

  it("label every room in both languages", () => {
    for (const room of ROOMS) {
      expect(studioMessages.en.drawing.rooms[room]).toBeTruthy()
      expect(studioMessages.th.drawing.rooms[room]).toMatch(/[฀-๿]/)
    }
  })
})

describe("drawings", () => {
  it("fit every elevation, roof and tree on the sheet", () => {
    for (const project of projects) {
      const l = elevationLayout(project)
      expect(l.x - l.eave, project.id).toBeGreaterThan(0)
      expect(l.x + l.w + l.eave, project.id).toBeLessThan(SHEET.width)
      for (const [x, y] of roofPolygon(project.roof, l)) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(SHEET.width)
        expect(y, project.id).toBeGreaterThan(0)
      }
      for (const tree of treeSpots(project.trees, l)) {
        expect(tree.x - tree.r * 0.5).toBeGreaterThanOrEqual(0)
        expect(tree.x + tree.r * 0.5).toBeLessThanOrEqual(SHEET.width)
      }
    }
  })

  it("draw to one scale per project: storeys and bays keep their real proportions", () => {
    const ari = elevationLayout(getProject("ari-house")!)
    expect(ari.w / ari.scale).toBeCloseTo(15)
    expect((ari.ground - ari.top) / ari.scale).toBeCloseTo(6.4)
  })

  it("place plan rooms side by side across the full width", () => {
    for (const project of projects) {
      const plan = planLayout(project)
      const last = plan.rooms.at(-1)!
      expect(plan.rooms[0].x).toBeCloseTo(plan.x)
      expect(last.x + last.w).toBeCloseTo(plan.x + plan.w)
      expect(plan.y).toBeGreaterThan(0)
      expect(plan.y + plan.d).toBeLessThan(SHEET.height)
    }
  })

  it("write dimensions to one decimal", () => {
    expect(metres(15)).toBe("15.0 m")
    expect(metres(6.4)).toBe("6.4 m")
  })
})
