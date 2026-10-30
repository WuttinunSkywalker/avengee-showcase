import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { BAY, STOREY, type Frontage, type Project, type Room } from "../data/projects"
import { elevationLayout, metres, planLayout, roofPolygon, SHEET, treeSpots, type ElevationLayout } from "../lib/drawing"
import { projectSun, SUN_DATES, sunPath, sunPosition, type SunDate } from "../lib/sun"

export const DRAWING_VIEWS = ["elevation", "plan", "section", "site"] as const
export type DrawingView = (typeof DRAWING_VIEWS)[number]

export interface DrawingLabels {
  rooms: Record<Room, string>
  north: string
  sun: string
  breeze: string
  site: {
    frontage: Record<Frontage, string>
    dates: Record<SunDate, string>
    compass: { n: string; e: string; s: string; w: string }
    afternoon: string
    latitude: (degrees: string) => string
    plot: (w: string, d: string) => string
  }
}

/** Linework drawn with `.ink` traces itself in when the drawing has `animate`; `--d` staggers it (ms). */
const ink = (delay = 0) => ({ className: "ink", pathLength: 1, style: { "--d": delay } as CSSProperties })
const points = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")

function GroundHatch({ from = 14, to = SHEET.width - 14 }: { from?: number; to?: number }) {
  const ticks: ReactNode[] = []
  for (let x = from + 4; x < to; x += 9) {
    ticks.push(<line key={x} x1={x} y1={SHEET.ground + 1} x2={x - 6} y2={SHEET.ground + 8} />)
  }
  return (
    <g stroke="var(--line)" strokeWidth={0.6} opacity={0.45}>
      {ticks}
    </g>
  )
}

function DimensionX({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g className="drawing-note">
      <g stroke="var(--line)" strokeWidth={0.7}>
        <line x1={x1} y1={y} x2={x2} y2={y} />
        <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
        <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
        <line x1={x1 - 3} y1={y + 3} x2={x1 + 3} y2={y - 3} strokeWidth={1.4} />
        <line x1={x2 - 3} y1={y + 3} x2={x2 + 3} y2={y - 3} strokeWidth={1.4} />
      </g>
      <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
        {label}
      </text>
    </g>
  )
}

function DimensionY({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g className="drawing-note">
      <g stroke="var(--line)" strokeWidth={0.7}>
        <line x1={x} y1={y1} x2={x} y2={y2} />
        <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
        <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
        <line x1={x - 3} y1={y1 + 3} x2={x + 3} y2={y1 - 3} strokeWidth={1.4} />
        <line x1={x - 3} y1={y2 + 3} x2={x + 3} y2={y2 - 3} strokeWidth={1.4} />
      </g>
      <text x={x + 6} y={(y1 + y2) / 2} className="fill-muted-foreground" fontSize={9} dominantBaseline="middle" transform={`rotate(-90 ${x + 6} ${(y1 + y2) / 2})`} textAnchor="middle" dy={-2}>
        {label}
      </text>
    </g>
  )
}

function Tree({ x, r, ground, delay }: { x: number; r: number; ground: number; delay: number }) {
  const canopyY = ground - r * 2.1
  return (
    <g fill="none" stroke="var(--line)" strokeWidth={0.8}>
      <line x1={x} y1={ground} x2={x} y2={canopyY + r * 0.6} {...ink(delay)} />
      <circle cx={x} cy={canopyY} r={r} {...ink(delay + 80)} />
      <circle cx={x - r * 0.55} cy={canopyY + r * 0.35} r={r * 0.7} {...ink(delay + 140)} />
      <circle cx={x + r * 0.6} cy={canopyY + r * 0.3} r={r * 0.65} {...ink(delay + 200)} />
    </g>
  )
}

function Person({ x, l }: { x: number; l: ElevationLayout }) {
  const s = l.scale
  const head = l.ground - 1.62 * s
  return (
    <g stroke="var(--line)" strokeWidth={0.9} fill="none" className="drawing-note">
      <circle cx={x} cy={head} r={0.13 * s} />
      <line x1={x} y1={head + 0.14 * s} x2={x} y2={l.ground - 0.85 * s} />
      <line x1={x} y1={l.ground - 0.85 * s} x2={x - 0.2 * s} y2={l.ground} />
      <line x1={x} y1={l.ground - 0.85 * s} x2={x + 0.2 * s} y2={l.ground} />
      <line x1={x - 0.25 * s} y1={head + 0.55 * s} x2={x + 0.25 * s} y2={head + 0.55 * s} />
    </g>
  )
}

function Elevation({ project }: { project: Project }) {
  const l = elevationLayout(project)
  const bayW = BAY * l.scale
  const roof = roofPolygon(project.roof, l)
  const roofTop = Math.min(...roof.map(([, y]) => y))
  const doorBay = Math.floor(project.bays / 2)
  const trees = treeSpots(project.trees, l)
  const margin = 0.45 * l.scale

  return (
    <>
      {trees.map((tree, i) => (
        <Tree key={i} x={tree.x} r={tree.r} ground={l.ground} delay={500 + i * 120} />
      ))}
      <g fill="var(--card)" stroke="var(--line)" strokeWidth={1.2}>
        {Array.from({ length: project.storeys }, (_, s) => (
          <rect key={s} x={l.x} y={l.ground - (s + 1) * l.floor} width={l.w} height={l.floor} {...ink(s * 120)} />
        ))}
      </g>
      {/* Shade cast by the eaves across the top of the wall */}
      <rect x={l.x} y={l.top} width={l.w} height={Math.min(l.floor * 0.35, 0.9 * l.scale)} fill="var(--shade)" className="wash" />
      <g stroke="var(--line)" strokeWidth={0.8}>
        {Array.from({ length: project.storeys }, (_, s) =>
          Array.from({ length: project.bays }, (_, b) => {
            const floorTop = l.ground - (s + 1) * l.floor
            const x = l.x + b * bayW + margin
            const w = bayW - margin * 2
            if (s === 0 && b === doorBay) {
              const doorW = Math.min(1.2 * l.scale, w)
              const dx = l.x + b * bayW + (bayW - doorW) / 2
              return <rect key={`${s}-${b}`} x={dx} y={l.ground - 2.4 * l.scale} width={doorW} height={2.4 * l.scale} fill="var(--shade)" {...ink(260 + b * 40)} />
            }
            const y = floorTop + (s === 0 ? 0.55 : 0.8) * l.scale
            const h = s === 0 ? l.ground - y - 0.05 * l.scale : l.floor - 1.5 * l.scale
            const screened = project.louvres && s > 0 && b % 2 === 0
            return (
              <g key={`${s}-${b}`}>
                <rect x={x} y={y} width={w} height={h} fill="var(--glass)" {...ink(260 + (s * project.bays + b) * 40)} />
                <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} {...ink(320 + b * 40)} />
                {screened &&
                  Array.from({ length: Math.floor(w / (0.22 * l.scale)) }, (_, i) => {
                    const lx = x + 0.11 * l.scale + i * 0.22 * l.scale
                    return <line key={i} x1={lx} y1={y - 0.15 * l.scale} x2={lx} y2={y + h + 0.15 * l.scale} strokeWidth={0.6} {...ink(420 + i * 8)} />
                  })}
              </g>
            )
          }),
        )}
      </g>
      <polygon points={points(roof)} fill="var(--shade)" stroke="var(--line)" strokeWidth={1.2} strokeLinejoin="round" {...ink(160)} />
      <line x1={14} y1={l.ground} x2={SHEET.width - 14} y2={l.ground} stroke="var(--line)" strokeWidth={1.6} {...ink(0)} />
      <GroundHatch />
      <Person x={l.x + doorBay * bayW + bayW / 2 + 1.4 * l.scale} l={l} />
      <DimensionX x1={l.x} x2={l.x + l.w} y={Math.max(14, roofTop - 12)} label={metres(l.widthM)} />
      <DimensionY x={l.x - l.eave * 0.55} y1={l.ground} y2={l.top} label={metres(l.wallM)} />
    </>
  )
}

function Plan({ project, labels }: { project: Project; labels: DrawingLabels }) {
  const p = planLayout(project)
  const bayW = BAY * p.scale
  const entrance = p.rooms.find((room) => room.room !== "court" && room.room !== "pool" && room.room !== "stair") ?? p.rooms[0]
  const doorW = Math.min(1.1 * p.scale, entrance.w - 6)
  const doorX = entrance.x + entrance.w / 2 - doorW / 2
  const front = p.y + p.d
  const wall = 3

  return (
    <>
      {p.rooms.map(({ room, x, w }, i) => (
        <g key={`${room}-${i}`}>
          {room === "court" && (
            <>
              <rect x={x} y={p.y} width={w} height={p.d} fill="var(--shade)" className="wash" />
              <circle cx={x + w / 2} cy={p.y + p.d * 0.4} r={Math.min(w, p.d) * 0.28} fill="none" stroke="var(--line)" strokeWidth={0.8} {...ink(500)} />
            </>
          )}
          {room === "pool" && <rect x={x + 6} y={p.y + 6} width={w - 12} height={p.d - 12} fill="var(--glass)" stroke="var(--line)" strokeWidth={0.8} {...ink(500)} />}
          {room === "stair" && (
            <g stroke="var(--line)" strokeWidth={0.6}>
              {Array.from({ length: 12 }, (_, t) => {
                const ty = p.y + p.d * 0.15 + t * ((p.d * 0.7) / 12)
                return <line key={t} x1={x + w * 0.2} y1={ty} x2={x + w * 0.8} y2={ty} {...ink(600 + t * 20)} />
              })}
            </g>
          )}
          {i > 0 && <line x1={x} y1={p.y} x2={x} y2={p.y + p.d} stroke="var(--line)" strokeWidth={1.6} {...ink(300 + i * 60)} />}
          <text x={x + w / 2} y={room === "stair" ? p.y + p.d * 0.1 : p.y + p.d * 0.62} textAnchor="middle" fontSize={Math.min(11, Math.max(8, w / 7))} className="drawing-note fill-foreground">
            {labels.rooms[room]}
          </text>
        </g>
      ))}
      {/* Outer walls, with the front door left open */}
      <g fill="none" stroke="var(--line)" strokeWidth={wall} strokeLinecap="square">
        <polyline points={points([[doorX, front], [p.x, front], [p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, front], [doorX + doorW, front]])} {...ink(0)} />
      </g>
      <path d={`M ${doorX} ${front} L ${doorX} ${front - doorW} A ${doorW} ${doorW} 0 0 1 ${doorX + doorW} ${front}`} fill="none" stroke="var(--line)" strokeWidth={0.7} {...ink(700)} />
      {/* Column grid at every bay */}
      <g fill="var(--line)">
        {Array.from({ length: project.bays + 1 }, (_, b) => (
          <rect key={b} x={p.x + b * bayW - 2.5} y={p.y - 2.5} width={5} height={5} className="wash" />
        ))}
      </g>
      <DimensionX x1={p.x} x2={p.x + p.w} y={p.y - 14} label={metres(project.bays * BAY)} />
      <DimensionY x={p.x + p.w + 16} y1={p.y + p.d} y2={p.y} label={metres(project.depth)} />
      {/* North arrow (the street side is at the bottom, so it turns with the house) and a 5 m scale bar */}
      <g className="drawing-note" stroke="var(--line)" fill="none" strokeWidth={0.8}>
        <circle cx={SHEET.width - 30} cy={30} r={11} />
        <polygon
          points={points([[SHEET.width - 30, 21], [SHEET.width - 25, 36], [SHEET.width - 30, 32], [SHEET.width - 35, 36]])}
          fill="var(--line)"
          transform={`rotate(${-project.site.facing - 180} ${SHEET.width - 30} 30)`}
          data-testid="plan-north"
        />
        <text x={SHEET.width - 30} y={54} textAnchor="middle" fontSize={8} stroke="none" className="fill-muted-foreground">
          {labels.north}
        </text>
      </g>
      <g className="drawing-note">
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={i} x={26 + i * p.scale} y={SHEET.height - 26} width={p.scale} height={4} fill={i % 2 ? "var(--card)" : "var(--line)"} stroke="var(--line)" strokeWidth={0.6} />
        ))}
        <text x={26} y={SHEET.height - 30} fontSize={8} className="fill-muted-foreground">
          0
        </text>
        <text x={26 + 5 * p.scale} y={SHEET.height - 30} fontSize={8} textAnchor="middle" className="fill-muted-foreground">
          5 m
        </text>
      </g>
    </>
  )
}

function Section({ project, labels }: { project: Project; labels: DrawingLabels }) {
  const l = elevationLayout(project)
  const roof = roofPolygon(project.roof, l)
  const roofTop = Math.min(...roof.map(([, y]) => y))
  const wallT = Math.max(3, 0.25 * l.scale)
  const slabT = Math.max(3, 0.3 * l.scale)
  // The sun's path is steep in Thailand; a 60° ray past the eave shows how much wall stays in shade.
  const eaveTip: [number, number] = [l.x - l.eave, roof[roof.length - 1][1]]
  const run = (eaveTip[1] - 24) / Math.tan((60 * Math.PI) / 180)
  const sun: [number, number] = [eaveTip[0] - run, 24]
  // Where the ray meets the wall: everything above that line is in shade at noon.
  const shadeHit: [number, number] = [l.x, Math.min(l.ground, eaveTip[1] + (l.x - eaveTip[0]) * Math.tan((60 * Math.PI) / 180))]

  return (
    <>
      <g fill="var(--line)">
        <rect x={l.x} y={l.top} width={wallT} height={l.ground - l.top} className="wash" />
        <rect x={l.x + l.w - wallT} y={l.top} width={wallT} height={l.ground - l.top} className="wash" />
        {Array.from({ length: project.storeys + 1 }, (_, i) => (
          <rect key={i} x={l.x} y={l.ground - i * l.floor - (i === 0 ? 0 : slabT / 2)} width={l.w} height={i === 0 ? slabT : slabT} className="wash" />
        ))}
      </g>
      <polygon points={points(roof)} fill="var(--line)" stroke="var(--line)" strokeWidth={1} {...ink(100)} />
      {/* Breeze: one arrow through every floor */}
      <g stroke="var(--leaf)" strokeWidth={1.1} fill="none" strokeDasharray="4 3" className="drawing-note">
        {Array.from({ length: project.storeys }, (_, s) => {
          const y = l.ground - s * l.floor - l.floor * 0.45
          const end = l.x + l.w + 28
          return (
            <g key={s}>
              <path d={`M ${l.x - 34} ${y} C ${l.x + l.w * 0.3} ${y - 12}, ${l.x + l.w * 0.7} ${y + 12}, ${end} ${y}`} />
              <polygon points={points([[end + 6, y], [end - 2, y - 4], [end - 2, y + 4]])} fill="var(--leaf)" strokeDasharray="0" />
            </g>
          )
        })}
        <text x={l.x - 34} y={l.ground - l.floor * 0.45 - 8} fontSize={8} stroke="none" className="fill-leaf">
          {labels.breeze}
        </text>
      </g>
      <g className="drawing-note" stroke="var(--line)" strokeWidth={0.8} fill="none">
        <circle cx={sun[0]} cy={sun[1]} r={6} />
        <line x1={sun[0]} y1={sun[1]} x2={shadeHit[0]} y2={shadeHit[1]} strokeDasharray="2 3" />
        <circle cx={shadeHit[0]} cy={shadeHit[1]} r={2} fill="var(--line)" />
        <text x={sun[0] + 10} y={sun[1] + 3} fontSize={8} stroke="none" className="fill-muted-foreground">
          {labels.sun}
        </text>
      </g>
      <line x1={14} y1={l.ground} x2={SHEET.width - 14} y2={l.ground} stroke="var(--line)" strokeWidth={1.6} {...ink(0)} />
      <GroundHatch />
      <DimensionY x={l.x + l.w + l.eave + 16} y1={l.ground} y2={Math.max(16, roofTop)} label={metres((l.ground - Math.max(16, roofTop)) / l.scale)} />
      <DimensionX x1={l.x} x2={l.x + l.w} y={l.ground + 22} label={metres(l.widthM)} />
      {Array.from({ length: project.storeys }, (_, s) => (
        <text key={s} x={l.x + wallT + 6} y={l.ground - s * l.floor - slabT - 4} fontSize={8} className="drawing-note fill-muted-foreground">
          {`+${(s * STOREY).toFixed(2)}`}
        </text>
      ))}
    </>
  )
}

/**
 * A project drawn the way the studio presents it: elevation, ground-floor
 * plan or section, generated from the project's numbers. Colours come from
 * the theme (--line, --shade, --glass), so drawings follow dark mode.
 */
/** Crops the sheet to the drawing, so a low house isn't lost in empty sky. The plan keeps the whole sheet. */
function viewBoxFor(project: Project, view: DrawingView): string {
  if (view === "plan" || view === "site") return `0 0 ${SHEET.width} ${SHEET.height}`
  const l = elevationLayout(project)
  const roofTop = Math.min(...roofPolygon(project.roof, l).map(([, y]) => y))
  const top = Math.max(0, Math.min(view === "section" ? 14 : roofTop - 28, roofTop - 28, l.ground - l.floor * 2.8))
  const bottom = l.ground + (view === "section" ? 34 : 14)
  return `0 ${top.toFixed(1)} ${SHEET.width} ${(bottom - top).toFixed(1)}`
}

const SITE = { cx: 250, cy: 150, r: 112 }
/** A paper-coloured outline behind small labels, so they stay legible where they cross linework. */
const halo = { stroke: "var(--card)", strokeWidth: 3, paintOrder: "stroke" as const, strokeLinejoin: "round" as const }
const dateStyle: Record<SunDate, { width: number; dash?: string }> = { june: { width: 1, dash: "5 3" }, equinox: { width: 1.6 }, december: { width: 1, dash: "1.5 3" } }

/** Turns a local point (front of the plot at +y) to face `angle` degrees, about the site centre. */
function turn([x, y]: [number, number], angle: number): [number, number] {
  const a = (angle * Math.PI) / 180
  return [SITE.cx + x * Math.cos(a) - y * Math.sin(a), SITE.cy + x * Math.sin(a) + y * Math.cos(a)]
}

/**
 * The site plan: the plot and the house turned to face the way they really do,
 * under the sun's path for that latitude on the solstices and equinoxes. The
 * outer circle is the horizon, the centre is straight overhead.
 */
function Site({ project, labels }: { project: Project; labels: DrawingLabels }) {
  const t = labels.site
  const { latitude, facing, plot, frontage } = project.site
  const [pw, pd] = plot
  const s = (SITE.r * 1.25) / Math.hypot(pw, pd)
  const angle = facing - 180
  const houseW = project.bays * BAY
  const setback = Math.min(3, (pd - project.depth) / 2)
  const front = (pd / 2) * s
  const ring = (altitude: number) => (SITE.r * (90 - altitude)) / 90
  const arcPoint = (azimuth: number, radius: number) => [SITE.cx + radius * Math.sin((azimuth * Math.PI) / 180), SITE.cy - radius * Math.cos((azimuth * Math.PI) / 180)]
  // The low western sun (below 30°, between south-west and north-west) is the one overhangs can't stop
  const [ox1, oy1] = arcPoint(225, SITE.r)
  const [ox2, oy2] = arcPoint(315, SITE.r)
  const [ix2, iy2] = arcPoint(315, ring(30))
  const [ix1, iy1] = arcPoint(225, ring(30))
  const [ax, ay] = arcPoint(270, (SITE.r + ring(30)) / 2)
  // The frontage name sits in its strip along the plot edge, turned with it but never upside down
  const frontLabel = turn([0, front + 6], angle)
  const labelAngle = ((((angle + 90) % 180) + 180) % 180) - 90
  const compass: [keyof typeof t.compass, number][] = [["n", 0], ["e", 90], ["s", 180], ["w", 270]]

  return (
    <>
      <path
        d={`M${ox1} ${oy1} A${SITE.r} ${SITE.r} 0 0 1 ${ox2} ${oy2} L${ix2} ${iy2} A${ring(30)} ${ring(30)} 0 0 0 ${ix1} ${iy1} Z`}
        fill="var(--shade)"
        opacity={0.5}
        className="wash"
      />
      <text x={ax} y={ay} textAnchor="middle" dominantBaseline="middle" fontSize={10} className="drawing-note fill-muted-foreground" transform={`rotate(-90 ${ax} ${ay})`}>
        {t.afternoon}
      </text>
      {/* Horizon, and rings at 30° and 60° above it */}
      <g stroke="var(--line)" fill="none">
        <circle {...ink(0)} cx={SITE.cx} cy={SITE.cy} r={SITE.r} strokeWidth={1} />
        {[30, 60].map((altitude) => (
          <circle key={altitude} cx={SITE.cx} cy={SITE.cy} r={ring(altitude)} strokeWidth={0.5} strokeDasharray="2 3" opacity={0.6} />
        ))}
        {compass.map(([key, azimuth]) => {
          const [x1, y1] = arcPoint(azimuth, SITE.r - 4)
          const [x2, y2] = arcPoint(azimuth, SITE.r + 4)
          return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.8} />
        })}
      </g>
      <g className="drawing-note fill-muted-foreground" fontSize={11} textAnchor="middle" dominantBaseline="middle">
        {compass.map(([key, azimuth]) => {
          const [x, y] = arcPoint(azimuth, SITE.r + 13)
          return (
            <text key={key} x={x} y={y} className={key === "n" ? "fill-foreground" : undefined} fontWeight={key === "n" ? 600 : undefined}>
              {t.compass[key]}
            </text>
          )
        })}
      </g>

      {/* The plot, its frontage and the house on it, turned to face the way they do */}
      <g transform={`rotate(${angle} ${SITE.cx} ${SITE.cy})`} data-testid="site-plot">
        <rect x={SITE.cx - (pw / 2) * s} y={SITE.cy + front} width={pw * s} height={12} fill="var(--shade)" className="wash" />
        <rect {...ink(200)} x={SITE.cx - (pw / 2) * s} y={SITE.cy - front} width={pw * s} height={pd * s} fill="none" stroke="var(--line)" strokeWidth={0.8} strokeDasharray="6 2 1 2" />
        <rect
          {...ink(400)}
          x={SITE.cx - (houseW / 2) * s}
          y={SITE.cy + front - (setback + project.depth) * s}
          width={houseW * s}
          height={project.depth * s}
          fill="var(--card)"
          stroke="var(--line)"
          strokeWidth={1.6}
        />
        {/* Hatched roof so the footprint reads as built */}
        <clipPath id={`site-roof-${project.id}`}>
          <rect x={SITE.cx - (houseW / 2) * s} y={SITE.cy + front - (setback + project.depth) * s} width={houseW * s} height={project.depth * s} />
        </clipPath>
        <g clipPath={`url(#site-roof-${project.id})`} stroke="var(--line)" strokeWidth={0.4} opacity={0.5}>
          {Array.from({ length: 40 }, (_, i) => {
            const x = SITE.cx - (houseW / 2) * s + i * 5 - 60
            return <line key={i} x1={x} y1={SITE.cy - front - 10} x2={x + 60} y2={SITE.cy + front + 10} />
          })}
        </g>
      </g>
      <text
        x={frontLabel[0]}
        y={frontLabel[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        className="drawing-note fill-foreground"
        transform={`rotate(${labelAngle} ${frontLabel[0]} ${frontLabel[1]})`}
        data-testid="site-frontage"
        {...halo}
      >
        {t.frontage[frontage]}
      </text>

      {/* The sun's path on the three dates, with the hours marked on the equinox */}
      <g fill="none" stroke="var(--leaf)">
        {SUN_DATES.map(({ id, declination }, index) => (
          <polyline
            key={id}
            {...ink(600 + index * 250)}
            points={points(sunPath(latitude, declination).map((position) => projectSun(position, SITE.cx, SITE.cy, SITE.r)))}
            strokeWidth={dateStyle[id].width}
            strokeDasharray={dateStyle[id].dash}
            data-testid={`sun-${id}`}
          />
        ))}
      </g>
      <g className="drawing-note">
        {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => {
          const [x, y] = projectSun(sunPosition(latitude, 0, hour), SITE.cx, SITE.cy, SITE.r)
          return (
            <g key={hour}>
              <circle cx={x} cy={y} r={hour % 3 === 0 ? 2.2 : 1.3} fill="var(--leaf)" />
              {hour % 3 === 0 && (
                <text x={x} y={y - 6} textAnchor="middle" fontSize={9.5} className="fill-muted-foreground" {...halo}>
                  {`${hour}:00`}
                </text>
              )}
            </g>
          )
        })}
      </g>

      {/* Key, latitude and plot size */}
      <g className="drawing-note" fontSize={10}>
        <text x={14} y={24} fontSize={11} className="fill-foreground">
          {t.latitude(latitude.toFixed(1))}
        </text>
        {SUN_DATES.map(({ id }, index) => (
          <g key={id}>
            <line x1={14} y1={42 + index * 15} x2={32} y2={42 + index * 15} stroke="var(--leaf)" strokeWidth={dateStyle[id].width} strokeDasharray={dateStyle[id].dash} />
            <text x={37} y={45 + index * 15} className="fill-muted-foreground">
              {t.dates[id]}
            </text>
          </g>
        ))}
        <text x={14} y={SHEET.height - 14} className="fill-muted-foreground">
          {t.plot(metres(pw), metres(pd))}
        </text>
      </g>
    </>
  )
}

export function ProjectDrawing({
  project,
  view,
  labels,
  title,
  animate = false,
  className,
}: {
  project: Project
  view: DrawingView
  labels: DrawingLabels
  title: string
  animate?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox={viewBoxFor(project, view)}
      // Without a title the drawing is decoration (e.g. inside a labelled button).
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      data-view={view}
      className={cn("h-auto w-full overflow-visible", animate && "drawing-animate", className)}
    >
      {view === "elevation" && <Elevation project={project} />}
      {view === "plan" && <Plan project={project} labels={labels} />}
      {view === "section" && <Section project={project} labels={labels} />}
      {view === "site" && <Site project={project} labels={labels} />}
    </svg>
  )
}
