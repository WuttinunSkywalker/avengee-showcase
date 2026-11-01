"use client"

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, MeshReflectorMaterial, MeshTransmissionMaterial, Sparkles, useTexture } from "@react-three/drei"
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import type { NoiseEffect } from "postprocessing"
import * as THREE from "three"
import { createRandom } from "@/lib/random"
import { scents, type ScentId } from "../data/scents"
import { bottleProfile, FILL, liquidProfile, sizeFactors } from "../lib/bottle"
import { SETTLED, sloshPush, stepSlosh, turnDelta, type Slosh } from "../lib/slosh"
import { valueNoise } from "../lib/noise"
import { bulbStrings } from "../lib/bulbs"
import { grainFor, stir } from "../lib/speed"
import { NOTE_MS, noteEnvelope, type NoteEffect } from "../lib/notes"
import { causticStrength } from "../lib/caustics"
import { DROP_RUN, gathered, pourDrops } from "../lib/pour"
import { coastBoard, type BottleSlot, type SpinBoard } from "../lib/spin"
import { CAMERA_SHOTS, cameraShot, isSoftwareRenderer, lightning, mixHex, lineupFraming, nearestTurn, nextTier, pickedLensShift, stalling, type CameraShot, type SceneState, type Tier } from "../lib/story"

/**
 * The fixed WebGL layer behind the page, painted in the page's own colour: a
 * glass flacon that turns and changes colour with the scroll. The hero is a
 * storm (lightning, mist, a beam of light); each chapter then puts the bottle
 * on its own floor (wet stone with rain rings, black lacquer under circling
 * jasmine, dark wood in incense smoke) that mirrors it, and the collection
 * lines up all three. Bloom, a vignette and fine grain finish it on larger
 * screens; phones get the same scene without the costly passes. Nothing in it
 * is needed to read or use the page.
 */
/** The scent open in the sheet and the size picked there; the matching bottle takes its proportions. */
export interface ChosenSize {
  scent: ScentId | null
  ml: number
  /** Words typed for the engraving, shown in gold on that bottle as they're typed. */
  engraving: string
}

type Slot = BottleSlot

/** How fast the page is scrolling, −1 (racing up) to 1 (racing down), written by the page every frame. */
export interface ScrollMotion {
  /** The scroll's speed, −1 (racing up) to 1 (racing down). */
  speed: number
  /** A note just pointed at, 1 fading to 0: stirs the scene like a fast scroll, without the lean. */
  burst: number
  /** A note's own flourish on the main bottle, and when it began (performance.now()). */
  note: { effect: NoteEffect; at: number } | null
}

/** What the bottles need to engrave the right one: who's chosen, and which bottle stands for them now. */
interface EngravingSource {
  chosen: RefObject<ChosenSize>
  owner: RefObject<Slot>
}

export function KlinScene({
  state,
  still: reduced,
  size,
  spin,
  motion,
  onReady,
}: {
  state: RefObject<SceneState>
  still: boolean
  size: RefObject<ChosenSize>
  /** Bottles spun by dragging the grab handles over them. */
  spin: RefObject<SpinBoard>
  motion: RefObject<ScrollMotion>
  /** Called once the floors' textures have loaded, so the opening curtain can lift. */
  onReady?: () => void
}) {
  // Only big screens may earn the full look (mirror floors, refracting glass, post effects)
  const [rich] = useState(() => window.innerWidth >= 768)
  // WebGL drawn on the CPU can't animate this scene: it starts (and stays) on still frames
  const [software] = useState(softwareWebGL)
  const [tier, setTier] = useState<Tier>(software ? "still" : "light")
  // A device that can't keep up stops animating and draws a fresh still on each scroll, like reduced motion
  const still = reduced || tier === "still"
  return (
    <Canvas
      className="!fixed inset-0 !h-[100lvh] !w-full"
      style={{ pointerEvents: "none" }}
      dpr={rich ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 0.2, 7], fov: 32 }}
      // Keeping the last frame means a screenshot or a slow frame never shows an empty canvas
      gl={{ antialias: !rich, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      frameloop={still ? "demand" : "always"}
      aria-hidden="true"
      data-testid="klin-canvas"
      data-renderer={software ? "software" : "gpu"}
    >
      <Backdrop state={state} still={still} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <pointLight position={[-3, 1.5, 2]} intensity={12} distance={9} color="#ffd7a0" />
      {/* A studio of soft light panels built on the GPU, so the glass has something to reflect without an HDR download.
          Drawn on the CPU, building it (a cube render, then blur shaders to compile) doubles the first frame and freezes
          the page for seconds, so there the glass goes without its reflections */}
      {software ? (
        <SoftwareStudio />
      ) : (
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, -2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffcf9e" position={[4, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 0, 4]} scale={2} />
      </Environment>
      )}
      {!still && <Governor rich={rich} tier={tier} onChange={setTier} />}
      <Story state={state} still={still} calm={reduced} rich={tier === "full"} size={size} spin={spin} motion={motion} onReady={onReady} />
      {tier === "full" && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.25} />
          <Grain motion={motion} />
          <Vignette offset={0.28} darkness={0.62} />
        </EffectComposer>
      )}
    </Canvas>
  )
}

/**
 * Light for renderers drawing on the CPU in place of the studio (see KlinScene): only a little more of
 * the ambient light, which costs nothing. Extra lamps were tried: each one slows every lit pixel drawn
 * on the CPU and they put no visible shine on the glass.
 */
function SoftwareStudio() {
  return <ambientLight intensity={0.3} />
}

/** Fine film grain over the full look, thickening while the page races. */
function Grain({ motion }: { motion: RefObject<ScrollMotion> }) {
  const grain = useRef<NoiseEffect>(null)
  useFrame(() => setGrain(grain.current, grainFor(motion.current.speed)))
  return <Noise ref={grain} opacity={grainFor(0)} premultiply />
}

function setGrain(effect: NoiseEffect | null, opacity: number) {
  if (effect) effect.blendMode.opacity.value = opacity
}

/**
 * Watches the frame rate in 1.5-second windows (after the first, while shaders
 * compile) and moves between looks: a big screen that holds a good rate earns
 * the full look, one that sags drops back, and a device that can barely draw
 * (a weak laptop, a headless browser on the CPU) settles on still frames, at
 * once if frames take whole seconds.
 */
function Governor({ rich, tier, onChange }: { rich: boolean; tier: Tier; onChange: (tier: Tier) => void }) {
  const meter = useRef({ start: -1, frames: 0, readings: [] as number[], recent: [] as number[] })
  useFrame(({ clock }, delta) => {
    const now = clock.elapsedTime
    const w = meter.current
    // Frames taking whole seconds (a CPU drawing WebGL on a busy machine) go straight to still frames
    w.recent = [...w.recent.slice(-1), delta]
    if (w.frames > 0 && stalling(w.recent)) return onChange("still")
    if (w.start < 0) w.start = now
    w.frames++
    if (now - w.start < 1.5) return
    w.readings.push(w.frames / (now - w.start))
    w.start = now
    w.frames = 0
    const next = nextTier(tier, w.readings, rich)
    if (next !== tier) {
      w.readings = []
      onChange(next)
    }
  })
  return null
}

let software: boolean | undefined
/** Whether the browser's WebGL is drawn on the CPU rather than a graphics chip, checked once. */
function softwareWebGL(): boolean {
  if (software === undefined) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2")
      const info = gl?.getExtension("WEBGL_debug_renderer_info")
      software = Boolean(gl && info && isSoftwareRenderer(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))))
      gl?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
      software = false
    }
  }
  return software
}

/** Paints the scene in the page colour, flashing pale in the hero's lightning, with fog that swallows the floor's far edge. */
function Backdrop({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const flash = useRef<THREE.PointLight>(null)
  useFrame(({ scene, clock }) => {
    const s = state.current
    if (!s) return
    const bolt = still ? 0 : lightning(clock.elapsedTime) * s.storm
    paintBackdrop(scene, mixHex(s.backdrop, "#6f8d99", bolt * 0.25))
    if (flash.current) flash.current.intensity = bolt * 90
  })
  return <pointLight ref={flash} position={[1, 6, -3]} distance={20} color="#cfe6ff" intensity={0} />
}

function paintBackdrop(scene: THREE.Scene, colour: string) {
  if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color()
  scene.background.set(colour)
  if (!scene.fog) scene.fog = new THREE.Fog(colour, 9, 17)
  scene.fog.color.set(colour)
}

/**
 * Puts the camera on its shot around the bottle (`target`), drifting a touch
 * and following the pointer, then shifts the lens so the bottle sits beside
 * the text instead of behind it: in the right third on wide screens, the upper
 * part of a phone screen. Once the collection scrolls up the screen, camera
 * and aim rise together by the same share of the view, so the bottles leave
 * with the page.
 */
function frameCamera(
  camera: THREE.PerspectiveCamera,
  shot: CameraShot,
  target: THREE.Vector3,
  exit: number,
  lens: { width: number; height: number; x: number; y: number },
) {
  const viewHeight = 2 * shot.radius * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const lift = exit * viewHeight
  const flat = shot.radius * Math.cos(shot.elevation)
  camera.position.set(target.x + flat * Math.sin(shot.azimuth), target.y + shot.radius * Math.sin(shot.elevation) - lift, target.z + flat * Math.cos(shot.azimuth))
  camera.lookAt(target.x, target.y - lift, target.z)
  camera.setViewOffset(lens.width, lens.height, lens.x, lens.y, lens.width, lens.height)
}

/** Eases a bottle's width and height (from its base) toward a size's proportions. */
function shapeToSize(group: THREE.Group, [width, height]: [number, number], dt: number) {
  const k = 1 - Math.exp(-8 * dt)
  group.scale.x += (width - group.scale.x) * k
  group.scale.z = group.scale.x
  group.scale.y += (height - group.scale.y) * k
  // Grow from the base, which sits 0.6 below the group's origin
  group.position.y = 0.6 * (group.scale.y - 1)
}

function isLifted(board: SpinBoard, slot: Slot): boolean {
  return board.hover === slot || board.held === slot
}

function lerpShot(from: CameraShot, to: CameraShot, k: number): CameraShot {
  return {
    radius: THREE.MathUtils.lerp(from.radius, to.radius, k),
    azimuth: THREE.MathUtils.lerp(from.azimuth, to.azimuth, k),
    elevation: THREE.MathUtils.lerp(from.elevation, to.elevation, k),
  }
}

const SLOT = 2.1
/** The line-up stands in the upper half of the screen, above the collection cards. */
const LINEUP_Y = 0.45

function Story({
  state,
  still,
  calm,
  rich,
  size,
  spin,
  motion,
  onReady,
}: {
  state: RefObject<SceneState>
  still: boolean
  /** Reduced motion: the camera keeps one view instead of travelling with the scroll. */
  calm: boolean
  rich: boolean
  size: RefObject<ChosenSize>
  spin: RefObject<SpinBoard>
  motion: RefObject<ScrollMotion>
  onReady?: () => void
}) {
  const hero = useRef<THREE.Group>(null)
  const shape = useRef<THREE.Group>(null)
  const leftShape = useRef<THREE.Group>(null)
  const middleShape = useRef<THREE.Group>(null)
  const owner = useRef<Slot>("hero")
  // How much of each side bottle's spin has been applied, and how high the pointed-at bottle is lifted
  const spun = useRef({ left: 0, middle: 0 })
  const lift = useRef(0)
  // How far the camera has moved in on the bottle picked from the line-up, and where that bottle stands
  const pick = useRef(0)
  const pickX = useRef(0)
  const engraving = useMemo<EngravingSource>(() => ({ chosen: size, owner }), [size])
  const left = useRef<THREE.Group>(null)
  const middle = useRef<THREE.Group>(null)
  const stage = useRef<THREE.Group>(null)
  const heroLiquid = useRef<THREE.MeshPhysicalMaterial>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const intro = useRef(still ? 1 : 0)
  const aim = useMemo(() => new THREE.Vector3(), [])
  const { size: viewport, invalidate } = useThree()
  const narrow = viewport.width < 768

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: (event.clientX / window.innerWidth) * 2 - 1, y: (event.clientY / window.innerHeight) * 2 - 1 }
    }
    const onScroll = () => invalidate()
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    // The grab handles ask for frames too, so a drag shows even on still frames
    window.addEventListener("klin:poke", onScroll)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("klin:poke", onScroll)
    }
  }, [invalidate])

  useFrame(({ camera, clock }, delta) => {
    const s = state.current
    if (!s || !hero.current) return
    const dt = Math.min(delta, 1 / 20)
    // The rise runs on the clock, not frame by frame, so a slow device still finishes it in 1.8 seconds
    if (intro.current < 1) intro.current = Math.min(1, clock.elapsedTime / 1.8)
    const rise = 1 - Math.pow(1 - intro.current, 3)

    // Framed with its cap clear of the header: the flacon is about 3 units tall in a view about 4 tall
    const baseY = narrow ? 0.6 : -0.85
    const scale = narrow ? 0.46 : 0.95
    const lineup = s.lineup
    // Phones stand the three bottles closer and smaller so the outer two stay on screen
    const { spread, scale: lineupScale, distance } = lineupFraming(viewport.width, viewport.height)
    const x = THREE.MathUtils.lerp(narrow ? 0 : 1.35, SLOT * spread, lineup)
    // In the storm the bottle hangs in the air and bobs; on a floor it stands still
    const bob = still ? 0 : Math.sin(clock.elapsedTime * 1.1) * 0.06 * s.storm
    const y = THREE.MathUtils.lerp(baseY - (1 - rise) * 2.5 + bob, LINEUP_Y, lineup)
    const currentScale = THREE.MathUtils.lerp(scale, lineupScale, lineup) * (0.85 + 0.15 * rise)
    // The bottle under the mouse rises a little into the beam
    lift.current = THREE.MathUtils.damp(lift.current, isLifted(spin.current, "hero") ? 0.09 : 0, 8, dt)
    hero.current.position.set(x, y + lift.current * currentScale, 0)
    hero.current.scale.setScalar(currentScale)
    const tilt = still ? 0 : 0.12
    // The camera travels its path of shots with the scroll (one fixed view for reduced motion)
    const path = calm ? lerpShot(CAMERA_SHOTS[0], CAMERA_SHOTS[CAMERA_SHOTS.length - 1], lineup) : cameraShot(s.shot)
    // The bottle open in the scent sheet turns its engraving to the camera, so the words can be read as they're typed
    const chosen = size.current
    owner.current = lineup < 0.5 ? "hero" : chosen.scent === "monsoon" ? "left" : chosen.scent === "jasmine-hour" ? "middle" : "hero"
    const showing = (slot: Slot) => chosen.scent !== null && owner.current === slot
    // A dragged bottle keeps its spin and coasts to a stop (at once for reduced motion)
    const board = spin.current
    coastBoard(board, dt, calm)
    const heroTurn = showing("hero") ? nearestTurn(hero.current.rotation.y, path.azimuth) : s.turn + pointer.current.x * tilt * 2 + board.hero.angle
    hero.current.rotation.y = THREE.MathUtils.damp(hero.current.rotation.y, heroTurn, still ? 60 : 6, dt)
    hero.current.rotation.x = THREE.MathUtils.damp(hero.current.rotation.x, pointer.current.y * tilt * s.storm, 6, dt)
    hero.current.rotation.z = THREE.MathUtils.damp(hero.current.rotation.z, -pointer.current.x * tilt * 0.4 * s.storm, 6, dt)
    heroLiquid.current?.color.set(s.liquid)
    // ...and takes the proportions of the size picked there (slim 30 ml, broad 100 ml): the main bottle
    // in a chapter, its own place in the line-up
    for (const [name, group] of [["hero", shape], ["left", leftShape], ["middle", middleShape]] as const) {
      if (group.current) shapeToSize(group.current, sizeFactors(chosen.scent && name === owner.current ? chosen.ml : 50), still ? 1 : dt)
    }

    // The floor sits under the bottle's base and widens for the line-up
    if (stage.current) {
      stage.current.position.set(THREE.MathUtils.lerp(x, 0, lineup), y - 0.6 * currentScale + 0.002, 0)
      stage.current.scale.setScalar(THREE.MathUtils.lerp(narrow ? 0.6 : 1, narrow ? 0.9 : 1.45, lineup))
    }

    // The other two bottles join for the line-up, monsoon on the left and jasmine in the middle, each
    // gathering where it stands as the drops poured from the main bottle arrive (see Pour)
    for (const [group, slot, name] of [[left, -1, "left"], [middle, 0, "middle"]] as const) {
      if (!group.current) continue
      const k = gathered(lineup, slot === -1 ? 0 : 1)
      group.current.visible = k > 0.001
      group.current.position.set(slot * SLOT * spread, LINEUP_Y, 0)
      group.current.scale.setScalar(lineupScale * k)
      if (showing(name)) group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, nearestTurn(group.current.rotation.y, path.azimuth), 6, dt)
      else group.current.rotation.y += (still ? 0 : dt * 0.25) + board[name].angle - spun.current[name]
      spun.current[name] = board[name].angle
      if (isLifted(board, name)) group.current.position.y += 0.09 * lineupScale
    }

    // Choosing a scent from the line-up on a wide screen opens the sheet on the left, over where the
    // monsoon bottle stands: the camera moves in on the chosen bottle and frames it to the right of the
    // sheet, so its size and engraving change in view, then eases back when the sheet closes
    const picking = !narrow && lineup > 0.5 && chosen.scent !== null
    if (picking) pickX.current = (owner.current === "left" ? -SLOT : owner.current === "middle" ? 0 : SLOT) * spread
    pick.current = still ? Number(picking) : THREE.MathUtils.damp(pick.current, picking ? 1 : 0, 3.5, dt)
    const close = pick.current

    // The camera aims at the middle of the resting bottle (not its rise or bob) or of the line-up
    const sway = still ? 0 : Math.sin(clock.elapsedTime * 0.12) * 0.03 + pointer.current.x * 0.05
    const radius = path.radius * THREE.MathUtils.lerp(1, distance, lineup)
    const shot = {
      radius: THREE.MathUtils.lerp(radius, 6.2, close),
      azimuth: THREE.MathUtils.lerp(path.azimuth, 0, close) + sway,
      elevation: THREE.MathUtils.lerp(path.elevation, 0.06, close),
    }
    aim.set(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(narrow ? 0 : 1.35, 0, lineup), pickX.current, close),
      THREE.MathUtils.lerp(baseY + 0.585 * scale, LINEUP_Y + 0.585 * lineupScale, lineup),
      0,
    )
    frameCamera(camera as THREE.PerspectiveCamera, shot, aim, s.exit, {
      width: viewport.width,
      height: viewport.height,
      // Wide screens: the bottle in the right third beside the text, then the line-up centred above the
      // collection cards, then the picked bottle beside the sheet. Phones: always in the upper part of
      // the screen, above the text panels.
      x: narrow ? 0 : THREE.MathUtils.lerp(-0.21 * viewport.width * (1 - lineup), pickedLensShift(viewport.width), close),
      y: (narrow ? 0.24 : THREE.MathUtils.lerp(0.2 * lineup, 0.1, close)) * viewport.height,
    })
  })

  return (
    <>
      <group ref={hero}>
        <group ref={shape}>
          <Bottle liquidRef={heroLiquid} liquid={scents[0].liquid} rich={rich} still={still} slot="hero" engraving={engraving} />
        </group>
        <Beam state={state} still={still} />
      </group>
      <group ref={left} visible={false}>
        <group ref={leftShape}>
          <Bottle liquid={scents[0].liquid} rich={false} still={still} slot="left" engraving={engraving} />
        </group>
      </group>
      <group ref={middle} visible={false}>
        <group ref={middleShape}>
          <Bottle liquid={scents[1].liquid} rich={false} still={still} slot="middle" engraving={engraving} />
        </group>
      </group>
      <group ref={stage}>
        <Suspense fallback={null}>
          <Floors state={state} still={still} rich={rich} motion={motion} onReady={onReady} />
        </Suspense>
        <Caustics state={state} still={still} />
      </group>
      <Pour state={state} from={shape} still={still} />
      <Rain state={state} still={still} motion={motion} />
      <Mist state={state} still={still} />
      <Petals state={state} still={still} motion={motion} />
      <Bulbs state={state} still={still} motion={motion} />
      <Embers state={state} still={still} motion={motion} />
      <Smoke state={state} still={still} />
      <NoteFlourish hero={hero} liquid={heroLiquid} motion={motion} still={still} />
    </>
  )
}

const POUR_VERTEX = /* glsl */ `
  uniform float uLineup;
  uniform float uRun;
  uniform float uScale;
  uniform mat4 uFrom;
  uniform mat4 uLeft;
  uniform mat4 uMiddle;
  attribute vec3 aTo;
  attribute float aSlot;
  attribute float aDelay;
  attribute vec3 aArc;
  attribute float aSize;
  varying float vAlpha;
  varying float vSlot;
  void main() {
    // Each drop leaves the main bottle's juice on its own moment and bows on its way to its place
    float t = clamp((uLineup - aDelay) / uRun, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    vec3 a = (uFrom * vec4(position, 1.0)).xyz;
    vec3 b = ((aSlot < 0.5 ? uLeft : uMiddle) * vec4(aTo, 1.0)).xyz;
    vec3 c = mix(a, b, 0.5) + aArc;
    vec3 p = mix(mix(a, c, e), mix(c, b, e), e);
    vAlpha = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t));
    vSlot = aSlot;
    vec4 view = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * uScale / -view.z;
  }
`
const POUR_FRAGMENT = /* glsl */ `
  uniform vec3 uLeftColour;
  uniform vec3 uMiddleColour;
  varying float vAlpha;
  varying float vSlot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // A round drop of juice with a bright glint up on one side
    float body = smoothstep(0.5, 0.34, d);
    float glint = smoothstep(0.17, 0.0, length(c - vec2(-0.12, -0.14)));
    vec3 juice = mix(uLeftColour, uMiddleColour, vSlot);
    gl_FragColor = vec4(juice * (0.85 + 0.5 * glint) + glint * 0.4, body * vAlpha * 0.92);
  }
`

/**
 * As the line-up forms, the main bottle pours drops of juice that bow
 * through the air and gather into the other two bottles where they stand,
 * so one bottle becomes three in one move. Every position is worked out in
 * the shader from the line-up's progress; nothing on still frames.
 */
function Pour({ state, from, still }: { state: RefObject<SceneState>; from: RefObject<THREE.Group | null>; still: boolean }) {
  const { size: viewport, gl } = useThree()
  const narrow = viewport.width < 768
  const points = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const drops = pourDrops(narrow ? 160 : 320)
    const shape = new THREE.BufferGeometry()
    shape.setAttribute("position", new THREE.Float32BufferAttribute(drops.flatMap((drop) => drop.from), 3))
    shape.setAttribute("aTo", new THREE.Float32BufferAttribute(drops.flatMap((drop) => drop.to), 3))
    shape.setAttribute("aSlot", new THREE.Float32BufferAttribute(drops.map((drop) => drop.slot), 1))
    shape.setAttribute("aDelay", new THREE.Float32BufferAttribute(drops.map((drop) => drop.delay), 1))
    shape.setAttribute("aArc", new THREE.Float32BufferAttribute(drops.flatMap((drop) => drop.arc), 3))
    shape.setAttribute("aSize", new THREE.Float32BufferAttribute(drops.map((drop) => drop.size), 1))
    return shape
  }, [narrow])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POUR_VERTEX,
        fragmentShader: POUR_FRAGMENT,
        uniforms: {
          uLineup: { value: 0 },
          uRun: { value: DROP_RUN },
          uScale: { value: 1 },
          uFrom: { value: new THREE.Matrix4() },
          uLeft: { value: new THREE.Matrix4() },
          uMiddle: { value: new THREE.Matrix4() },
          uLeftColour: { value: new THREE.Color(scents[0].liquid) },
          uMiddleColour: { value: new THREE.Color(scents[1].liquid) },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  useFrame(() => {
    const s = state.current
    if (s) pourDrops3D(points.current, material, from.current, s.lineup, still, viewport, gl.getPixelRatio())
  })
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} visible={false} renderOrder={4} />
}

const BOTTLE_BASE = new THREE.Matrix4().makeTranslation(0, -0.6, 0)
const AT_REST = new THREE.Quaternion()
const place = new THREE.Vector3()
const sized = new THREE.Vector3()

function pourDrops3D(
  points: THREE.Points | null,
  material: THREE.ShaderMaterial,
  from: THREE.Group | null,
  lineup: number,
  still: boolean,
  viewport: { width: number; height: number },
  pixelRatio: number,
) {
  if (!points || !from) return
  // Only while some drop is in the air
  points.visible = !still && lineup > 0.02 && lineup < 0.99
  if (!points.visible) return
  const { spread, scale } = lineupFraming(viewport.width, viewport.height)
  const u = material.uniforms
  u.uLineup.value = lineup
  // Projected size: a world-sized drop over its depth, for this field of view (32°) and screen
  u.uScale.value = (viewport.height * pixelRatio) / (2 * Math.tan(THREE.MathUtils.degToRad(16)))
  u.uFrom.value.multiplyMatrices(from.matrixWorld, BOTTLE_BASE)
  for (const [uniform, slot] of [[u.uLeft, -1], [u.uMiddle, 0]] as const) {
    uniform.value.compose(place.set(slot * SLOT * spread, LINEUP_Y, 0), AT_REST, sized.setScalar(scale)).multiply(BOTTLE_BASE)
  }
}

const CAUSTIC_SHADER = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // The well-known iterated water caustic (after joltz0r and Dave Hoskins): light bending through
  // the glass and juice gathers into bright, slowly shifting threads
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uStrength;
    uniform vec3 uColour;
    varying vec2 vUv;
    float caustic(vec2 p, float t) {
      vec2 i = p;
      float c = 1.0;
      float inten = 0.005;
      for (int n = 0; n < 4; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 4.0;
      c = 1.17 - pow(c, 1.4);
      return pow(abs(c), 6.0);
    }
    void main() {
      // Wider than deep: seen low across the floor, the cells foreshorten back to round
      vec2 p = vUv * vec2(5.0, 2.6) - 250.0;
      float light = caustic(p, uTime * 0.35);
      // A soft patch, brightest near the bottle and fading away from it
      vec2 c = (vUv - vec2(0.62, 0.5)) / vec2(0.55, 0.5);
      float pool = smoothstep(1.0, 0.25, length(c));
      gl_FragColor = vec4(uColour * min(light, 1.4) * pool * uStrength, 1.0);
    }
  `,
}

/**
 * Light thrown through the glass and juice onto the floor beside the bottle,
 * in the juice's colour: a moving caustic drawn in a shader (cheap, unlike a
 * raymarched one), behind and to the left, away from the key light. Only on
 * a floor (causticStrength); held still on still frames.
 */
function Caustics({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...CAUSTIC_SHADER,
        uniforms: { uTime: { value: 3 }, uStrength: { value: 0 }, uColour: { value: new THREE.Color() } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useFrame(({ clock }) => {
    const s = state.current
    if (s) castCaustics(mesh.current, material, causticStrength(s), s.liquid, still ? 3 : clock.elapsedTime + 3)
  })
  return (
    <mesh ref={mesh} material={material} rotation-x={-Math.PI / 2} position={[-0.95, 0.006, -0.1]} renderOrder={2} visible={false}>
      <planeGeometry args={[2.8, 2]} />
    </mesh>
  )
}

function castCaustics(mesh: THREE.Mesh | null, material: THREE.ShaderMaterial, strength: number, liquid: string, time: number) {
  if (!mesh) return
  mesh.visible = strength > 0.01
  if (!mesh.visible) return
  material.uniforms.uStrength.value = strength * 1.1
  material.uniforms.uColour.value.set(liquid).lerp(WHITE, 0.15)
  material.uniforms.uTime.value = time
}

const WHITE = new THREE.Color("#ffffff")

const LEAVES = 7

interface LeafFlight {
  x: number
  delay: number
  sway: number
  spin: number
  size: number
}

/** Where each falling leaf starts across the bottle, when it lets go and how it flutters (seeded, the same every time). */
function leafFlights(): LeafFlight[] {
  const random = createRandom("klin:leaves")
  return Array.from({ length: LEAVES }, (_, i) => ({
    x: (i / (LEAVES - 1) - 0.5) * 1.8 + (random() - 0.5) * 0.3,
    delay: random() * 0.3,
    sway: 0.6 + random() * 0.8,
    spin: (random() < 0.5 ? -1 : 1) * (2 + random() * 3),
    size: 0.8 + random() * 0.5,
  }))
}

/** A small leaf, pointed at both ends with a midrib, white so the material tints it. */
function leafArt(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 64
  const context = canvas.getContext("2d")!
  context.fillStyle = "#ffffff"
  context.beginPath()
  context.moveTo(6, 32)
  context.quadraticCurveTo(64, -6, 122, 32)
  context.quadraticCurveTo(64, 70, 6, 32)
  context.fill()
  context.strokeStyle = "rgba(0, 0, 0, 0.28)"
  context.lineWidth = 2.5
  context.beginPath()
  context.moveTo(10, 32)
  context.lineTo(118, 32)
  context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const GLINT_SHADER = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uProgress;
    uniform float uStrength;
    uniform vec3 uColour;
    varying vec2 vUv;
    void main() {
      // A bright, narrow sheen with a softer halo, sweeping up diagonally across the glass
      float d = vUv.x * 0.55 + vUv.y;
      float front = mix(0.1, 1.4, uProgress);
      float gap = abs(d - front);
      float band = smoothstep(0.1, 0.0, gap) + 0.35 * smoothstep(0.3, 0.0, gap);
      // Kept on the bottle's body (base to shoulder, side to side), softly cornered
      vec2 c = abs(vUv - vec2(0.5, 0.46)) / vec2(0.38, 0.28);
      float onGlass = 1.0 - smoothstep(0.72, 1.0, max(c.x, c.y));
      gl_FragColor = vec4(uColour * band * onGlass * uStrength, 1.0);
    }
  `,
}

/**
 * The note last pointed at, on the main bottle: a sweep of coloured light
 * across the glass, a glow in the juice, or a few leaves falling past it.
 * Each runs once and goes (NOTE_MS); nothing on still frames.
 */
function NoteFlourish({
  hero,
  liquid,
  motion,
  still,
}: {
  hero: RefObject<THREE.Group | null>
  liquid: RefObject<THREE.MeshPhysicalMaterial | null>
  motion: RefObject<ScrollMotion>
  still: boolean
}) {
  const glint = useRef<THREE.Mesh>(null)
  const leaves = useRef<THREE.InstancedMesh>(null)
  const glintMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...GLINT_SHADER,
        uniforms: { uProgress: { value: 0 }, uStrength: { value: 0 }, uColour: { value: new THREE.Color() } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const leafMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: leafArt(), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, depthWrite: false }), [])
  const flights = useMemo(() => leafFlights(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const centre = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const note = motion.current.note
    const t = note ? (performance.now() - note.at) / NOTE_MS : 1
    const strength = still || !note ? 0 : noteEnvelope(t)
    const effect = note?.effect
    const colour = effect && effect.kind !== "stir" ? effect.colour : "#ffffff"
    if (!hero.current) return
    hero.current.getWorldPosition(centre)
    const scale = hero.current.scale.x
    sweepGlint(glint.current, glintMaterial, effect?.kind === "glint" ? strength : 0, t, colour, centre, scale, camera)
    glowJuice(liquid.current, effect?.kind === "glow" ? strength : 0, colour)
    dropLeaves(leaves.current, leafMaterial, dummy, flights, effect?.kind === "leaves" && !still ? t : -1, colour, centre, scale)
  })

  return (
    <>
      <mesh ref={glint} material={glintMaterial} renderOrder={6} visible={false}>
        <planeGeometry args={[1.7, 2.7]} />
      </mesh>
      <instancedMesh ref={leaves} args={[undefined, leafMaterial, LEAVES]} renderOrder={5} visible={false}>
        <planeGeometry args={[0.34, 0.17]} />
      </instancedMesh>
    </>
  )
}

function sweepGlint(mesh: THREE.Mesh | null, material: THREE.ShaderMaterial, strength: number, t: number, colour: string, centre: THREE.Vector3, scale: number, camera: THREE.Camera) {
  if (!mesh) return
  mesh.visible = strength > 0.001
  if (!mesh.visible) return
  material.uniforms.uStrength.value = strength * 1.1
  // The sweep crosses in the first two thirds of the run, then fades where it ended
  material.uniforms.uProgress.value = Math.min(1, t / 0.65)
  material.uniforms.uColour.value.set(colour)
  // On the near side of the glass, facing the camera
  mesh.position.copy(camera.position).sub(centre).setLength(0.7 * scale).add(centre)
  mesh.position.y += 0.25 * scale
  mesh.scale.setScalar(scale)
  mesh.lookAt(camera.position)
}

function glowJuice(material: THREE.MeshPhysicalMaterial | null, strength: number, colour: string) {
  if (!material) return
  if (strength > 0.001) material.emissive.set(colour)
  material.emissiveIntensity = strength * 0.85
}

function dropLeaves(
  mesh: THREE.InstancedMesh | null,
  material: THREE.MeshBasicMaterial,
  dummy: THREE.Object3D,
  flights: readonly LeafFlight[],
  t: number,
  colour: string,
  centre: THREE.Vector3,
  scale: number,
) {
  if (!mesh) return
  mesh.visible = t >= 0 && t < 1
  if (!mesh.visible) return
  material.color.set(colour)
  flights.forEach((leaf, i) => {
    // Each leaf falls from above the cap to below the base in the time it has after letting go
    const k = THREE.MathUtils.clamp((t - leaf.delay) / (1 - leaf.delay), 0, 1)
    const fall = k * k * (3 - 2 * k)
    dummy.position.set(
      centre.x + (leaf.x + Math.sin(k * Math.PI * 2 * leaf.sway) * 0.25) * scale,
      centre.y + (2.1 - fall * 3.6) * scale,
      centre.z + 0.9 * scale,
    )
    dummy.rotation.set(Math.sin(k * 6) * 0.6, k * leaf.spin, k * leaf.spin * 0.7 + i)
    // Unseen until it lets go, and fading away at the very end
    dummy.scale.setScalar(k > 0 && k < 1 ? leaf.size * scale * Math.min(1, (1 - k) * 6) : 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

/** A heavy glass flacon turned on a lathe, its juice inside, a brass collar and cap, and the house name engraved in gold. */
function Bottle({
  liquid,
  liquidRef,
  rich,
  still,
  slot,
  engraving,
}: {
  liquid: string
  liquidRef?: RefObject<THREE.MeshPhysicalMaterial | null>
  rich: boolean
  still: boolean
  slot: Slot
  engraving: EngravingSource
}) {
  const glass = useMemo(() => new THREE.LatheGeometry(bottleProfile().map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  // The juice is turned taller than it stands and cut off at its surface in the shader, so the surface can tilt and slosh
  const juice = useMemo(() => new THREE.LatheGeometry(liquidProfile(FILL + 0.2).map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  const juiceMesh = useRef<THREE.Mesh>(null)
  const surface = useMemo(() => ({ uLevel: { value: FILL }, uTilt: { value: new THREE.Vector2() } }), [])
  const sloshing = useRef<JuiceMotion>({ slosh: SETTLED, heading: null, turn: 0, height: null })
  useFrame((_, delta) => {
    if (!still) stepJuice(juiceMesh.current, sloshing.current, surface, delta)
  })
  return (
    <group position={[0, -0.6, 0]}>
      <mesh ref={juiceMesh} geometry={juice} renderOrder={1}>
        <meshPhysicalMaterial
          ref={liquidRef}
          color={liquid}
          roughness={0.12}
          transmission={0.5}
          thickness={1.2}
          ior={1.35}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
          onBeforeCompile={(shader) => cutJuice(shader, surface)}
          customProgramCacheKey={() => "klin-juice"}
        />
      </mesh>
      <mesh geometry={glass} renderOrder={2}>
        {rich ? (
          // Refracts what's behind it with a touch of colour fringing, like thick cut glass
          <MeshTransmissionMaterial
            samples={4}
            resolution={512}
            thickness={0.5}
            roughness={0.03}
            ior={1.5}
            chromaticAberration={0.08}
            anisotropy={0.15}
            distortion={0.12}
            distortionScale={0.4}
            temporalDistortion={0.04}
            clearcoat={1}
            attenuationDistance={2.5}
            attenuationColor="#f4efe6"
            transparent
            opacity={0.55}
          />
        ) : (
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} transmission={1} thickness={0.45} ior={1.5} clearcoat={1} transparent opacity={0.5} envMapIntensity={1.4} />
        )}
      </mesh>
      <Engraving slot={slot} source={engraving} />
      {/* Collar and cap */}
      <mesh position={[0, 1.83, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 48]} />
        <meshStandardMaterial color="#d8b06a" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.12, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 6]} />
        <meshStandardMaterial color="#1c1714" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  )
}

interface JuiceMotion {
  slosh: Slosh
  /** The bottle's heading and turning speed last frame, and its height, to tell how it's moving. */
  heading: number | null
  turn: number
  height: number | null
}

/**
 * Cuts the juice off at its surface, a plane through the fill level tilted by
 * the slosh. Seen through the cut, the juice's inner walls stand in for the
 * surface (the usual trick for liquid in a bottle), shaded a touch lighter.
 */
function cutJuice(shader: THREE.WebGLProgramParametersWithUniforms, surface: { uLevel: { value: number }; uTilt: { value: THREE.Vector2 } }) {
  shader.uniforms.uLevel = surface.uLevel
  shader.uniforms.uTilt = surface.uTilt
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vJuice;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvJuice = position;")
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vJuice;\nuniform float uLevel;\nuniform vec2 uTilt;")
    .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (vJuice.y > uLevel + dot(vJuice.xz, uTilt)) discard;")
    .replace("#include <dithering_fragment>", "#include <dithering_fragment>\nif (!gl_FrontFacing) gl_FragColor.rgb = mix(gl_FragColor.rgb, diffuse * 1.08, 0.6);")
}

/** Feels how the bottle turned and grew since last frame, and lets the juice's surface swing on its spring. */
function stepJuice(mesh: THREE.Mesh | null, motion: JuiceMotion, surface: { uTilt: { value: THREE.Vector2 } }, delta: number) {
  if (!mesh) return
  const m = mesh.matrixWorld.elements
  const heading = Math.atan2(m[8], m[10])
  const height = Math.hypot(m[4], m[5], m[6])
  const dt = Math.min(delta, 1 / 30)
  if (motion.heading === null || motion.height === null || dt <= 0) {
    motion.heading = heading
    motion.height = height
    return
  }
  const turn = turnDelta(motion.heading, heading) / dt
  const growth = (height - motion.height) / dt / Math.max(height, 0.001)
  motion.slosh = stepSlosh(motion.slosh, sloshPush((turn - motion.turn) / dt, growth), dt)
  motion.heading = heading
  motion.turn = turn
  motion.height = height
  surface.uTilt.value.set(motion.slosh.x, motion.slosh.z)
}

/**
 * The engraving in gold on the glass: "KLIN" over "BANGKOK", or over the
 * guest's own words while this bottle is the one open in the scent sheet,
 * redrawn as they type. Drawn in the page's display faces (Bodoni, Trirong for
 * Thai) once they've loaded.
 */
function Engraving({ slot, source }: { slot: Slot; source: EngravingSource }) {
  const [art, setArt] = useState<EngravingArt | null>(null)
  const shown = useRef<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const style = getComputedStyle(document.documentElement)
    const family = [style.getPropertyValue("--font-bodoni"), style.getPropertyValue("--font-trirong")].map((value) => value.trim()).filter(Boolean).join(", ") || "serif"
    // A load cut short (the page reloading, or a missing local fallback face) draws with whatever face is ready
    document.fonts
      .load(`400 150px ${family}`)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setArt(engravingArt(family))
      })
    return () => {
      cancelled = true
    }
  }, [])
  useFrame(() => {
    if (!art) return
    const chosen = source.chosen.current
    const words = source.owner.current === slot && chosen.engraving ? chosen.engraving : ""
    if (words === shown.current) return
    shown.current = words
    drawEngraving(art, words)
  })
  if (!art) return null
  return (
    // Drawn after the glass, and lit from within so the letters read against any juice colour
    <mesh position={[0, 0.78, 0]} renderOrder={3}>
      <cylinderGeometry args={[0.775, 0.775, 0.5, 64, 1, true, -0.62, 1.24]} />
      <meshStandardMaterial
        map={art.texture}
        emissiveMap={art.texture}
        emissive="#f2cf8a"
        emissiveIntensity={0.55}
        transparent
        metalness={1}
        roughness={0.25}
        color="#e2bf7f"
        depthWrite={false}
      />
    </mesh>
  )
}

interface EngravingArt {
  canvas: HTMLCanvasElement
  texture: THREE.CanvasTexture
  family: string
}

function engravingArt(family: string): EngravingArt {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 410
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const art = { canvas, texture, family }
  drawEngraving(art, "")
  return art
}

/** "KLIN" large, and beneath it "BANGKOK" or the guest's words, shrunk to fit the band. */
function drawEngraving({ canvas, texture, family }: EngravingArt, words: string) {
  const context = canvas.getContext("2d")!
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "#ffffff"
  context.textAlign = "center"
  context.font = `400 190px ${family}`
  context.letterSpacing = "38px"
  context.fillText("KLIN", 530, 220)
  if (words) {
    let size = 96
    context.letterSpacing = "6px"
    do {
      context.font = `400 ${size}px ${family}`
      size -= 4
    } while (context.measureText(words).width > canvas.width * 0.86 && size > 36)
    context.fillText(words, 515, 340)
  } else {
    context.font = `400 54px ${family}`
    context.letterSpacing = "22px"
    context.fillText("BANGKOK", 522, 330)
  }
  texture.needsUpdate = true
}

/**
 * A soft disc, bright in the middle and fading to nothing at the edge. As a
 * `map` its alpha does the fading (mist, smoke); as an `alphaMap` three.js
 * reads the green channel, so that version fades white to black instead.
 */
function softDisc(forAlphaMap = false, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const context = canvas.getContext("2d")!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  const stops: [number, number][] = [
    [0, 1],
    [0.5, 0.85],
    [0.78, 0.35],
    [1, 0],
  ]
  for (const [at, value] of stops) {
    const grey = Math.round(value * 255)
    gradient.addColorStop(at, forAlphaMap ? `rgb(${grey},${grey},${grey})` : `rgba(255,255,255,${value})`)
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/** A cone of light from above, with dust turning in it; brightest in the storm, a soft key light after. */
function Beam({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uOpacity: { value: 0.5 }, uColour: { value: new THREE.Color("#fff1d6") } }), [])
  useFrame(({ size }) => {
    const s = state.current
    // Softer on phones, where the beam falls behind the text
    const strength = size.width < 768 ? 0.45 : 1
    if (material.current && s) setBeam(material.current, (0.16 + 0.22 * s.storm) * strength, s.accent)
  })
  return (
    <group position={[0, 2.6, 0]}>
      <mesh>
        <coneGeometry args={[1.5, 6, 48, 1, true]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          vertexShader={BEAM_VERTEX}
          fragmentShader={BEAM_FRAGMENT}
        />
      </mesh>
      <Sparkles count={70} scale={[2.2, 5, 1.2]} position={[0, -1.8, 0]} size={2} speed={still ? 0 : 0.25} opacity={0.75} color="#fff4dc" noise={0.4} />
    </group>
  )
}

function setBeam(material: THREE.ShaderMaterial, opacity: number, colour: string) {
  material.uniforms.uOpacity.value = opacity
  material.uniforms.uColour.value.set(colour).lerp(new THREE.Color("#ffffff"), 0.6)
}

const BEAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-world.xyz);
    gl_Position = projectionMatrix * world;
  }
`
// Fades towards the tip and towards the cone's silhouette, so it reads as a volume of light
const BEAM_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColour;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float along = smoothstep(0.0, 0.85, 1.0 - vUv.y) * smoothstep(1.0, 0.75, 1.0 - vUv.y);
    float facing = pow(abs(dot(vNormal, vView)), 1.6);
    gl_FragColor = vec4(uColour, along * facing * uOpacity);
  }
`

/**
 * The stage under the bottle: a blurred mirror (wet, lacquered or oiled) with
 * each chapter's surface laid over it: CC0 wet stone, nothing for the black
 * lacquer, dark wood. Rain rings spread on the stone.
 */
function Floors({
  state,
  still,
  rich,
  motion,
  onReady,
}: {
  state: RefObject<SceneState>
  still: boolean
  rich: boolean
  motion: RefObject<ScrollMotion>
  onReady?: () => void
}) {
  const textures = useTexture([
    "/images/klin/stone-color.jpg",
    "/images/klin/stone-normal.jpg",
    "/images/klin/stone-rough.jpg",
    "/images/klin/wood-color.jpg",
    "/images/klin/wood-normal.jpg",
    "/images/klin/wood-rough.jpg",
  ])
  const [stoneColour, stoneNormal, stoneRough, woodColour, woodNormal, woodRough] = useMemo(() => prepareTextures(textures), [textures])
  const alpha = useMemo(() => softDisc(true), [])
  // Each floor dissolves in and out through the same noise, its edge glowing: cool silver on wet stone, ember on wood
  const stoneDissolve = useMemo(() => dissolver("#9fd0e0"), [])
  const woodDissolve = useMemo(() => dissolver("#ff8a3d"), [])
  // Rendering here means the textures above have loaded
  useEffect(() => onReady?.(), [onReady])
  const mirror = useRef<THREE.MeshStandardMaterial>(null)
  const stone = useRef<THREE.MeshStandardMaterial>(null)
  const wood = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const s = state.current
    if (s) fadeFloors(s, mirror.current, stone.current, wood.current)
  })

  return (
    <group rotation-x={-Math.PI / 2}>
      <mesh>
        <circleGeometry args={[4, 72]} />
        {rich ? (
          <MeshReflectorMaterial
            ref={mirror as never}
            blur={[320, 90]}
            resolution={512}
            mixBlur={1}
            mixStrength={2.4}
            mirror={0.6}
            roughness={0.7}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            metalness={0.5}
            alphaMap={alpha}
            transparent
            opacity={0}
            depthWrite={false}
          />
        ) : (
          <meshStandardMaterial ref={mirror} roughness={0.25} metalness={0.6} alphaMap={alpha} transparent opacity={0} depthWrite={false} />
        )}
      </mesh>
      <mesh position-z={0.003} renderOrder={1}>
        <circleGeometry args={[4, 72]} />
        <meshStandardMaterial
          ref={stone}
          map={stoneColour}
          normalMap={stoneNormal}
          roughnessMap={stoneRough}
          roughness={0.32}
          color="#b3c4c8"
          alphaMap={alpha}
          transparent
          opacity={0.85}
          depthWrite={false}
          userData={{ dissolve: stoneDissolve.uniforms }}
          onBeforeCompile={stoneDissolve.onBeforeCompile}
          customProgramCacheKey={dissolveCacheKey}
        />
      </mesh>
      <mesh position-z={0.004} renderOrder={1}>
        <circleGeometry args={[4, 72]} />
        <meshStandardMaterial
          ref={wood}
          map={woodColour}
          normalMap={woodNormal}
          roughnessMap={woodRough}
          roughness={0.5}
          color="#d6a37a"
          alphaMap={alpha}
          transparent
          opacity={0.9}
          depthWrite={false}
          userData={{ dissolve: woodDissolve.uniforms }}
          onBeforeCompile={woodDissolve.onBeforeCompile}
          customProgramCacheKey={dissolveCacheKey}
        />
      </mesh>
      <Ripples state={state} still={still} motion={motion} />
    </group>
  )
}

/** Tiles the floor maps (stone finer than wood) and marks the colour maps as sRGB. */
function prepareTextures(list: THREE.Texture[]): THREE.Texture[] {
  list.forEach((texture, i) => {
    const repeat = i < 3 ? 2.4 : 1.6
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat, repeat)
    texture.anisotropy = 8
    if (i === 0 || i === 3) texture.colorSpace = THREE.SRGBColorSpace
  })
  return list
}

/** Shows each chapter's floor in turn, the mirror under all of them tinted darker than the page. */
function fadeFloors(s: SceneState, mirror: THREE.MeshStandardMaterial | null, stone: THREE.MeshStandardMaterial | null, wood: THREE.MeshStandardMaterial | null) {
  if (mirror) {
    mirror.opacity = s.stone + s.lacquer + s.wood
    mirror.color.set(mixHex(s.backdrop, "#000000", 0.55))
  }
  // Stone and wood dissolve through the noise rather than fading (the stone lets the mirror through, so it reads as wet)
  setDissolve(stone, s.stone)
  setDissolve(wood, s.wood)
}

function setDissolve(material: THREE.Material | null, amount: number) {
  if (!material) return
  material.visible = amount > 0.001
  const uniforms = material.userData.dissolve as DissolveUniforms | undefined
  if (uniforms) uniforms.uDissolve.value = amount
}

interface DissolveUniforms {
  uDissolve: { value: number }
  uNoise: { value: THREE.Texture }
  uEdge: { value: THREE.Color }
}

let dissolveNoise: THREE.DataTexture | null = null
/** The shared mask the floors dissolve through: tileable fractal noise, made once. */
function dissolveTexture(): THREE.DataTexture {
  if (!dissolveNoise) {
    dissolveNoise = new THREE.DataTexture(valueNoise(256, "klin:dissolve"), 256, 256, THREE.RedFormat, THREE.UnsignedByteType)
    dissolveNoise.wrapS = dissolveNoise.wrapT = THREE.RepeatWrapping
    dissolveNoise.magFilter = dissolveNoise.minFilter = THREE.LinearFilter
    dissolveNoise.needsUpdate = true
  }
  return dissolveNoise
}

const dissolveCacheKey = () => "klin-dissolve"

/**
 * Patches a standard material so it shows only where the noise is below
 * `uDissolve` (0 hidden, 1 whole), with a glowing band along the edge while
 * it moves. Lighting and maps are untouched.
 */
function dissolver(edge: string) {
  const uniforms: DissolveUniforms = { uDissolve: { value: 0 }, uNoise: { value: dissolveTexture() }, uEdge: { value: new THREE.Color(edge) } }
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + DISSOLVE_DECLARATIONS)
      .replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\n" + DISSOLVE_MASK)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n" + DISSOLVE_EDGE)
  }
  return { uniforms, onBeforeCompile }
}

const DISSOLVE_DECLARATIONS = /* glsl */ `
  uniform float uDissolve;
  uniform sampler2D uNoise;
  uniform vec3 uEdge;
  float dissolveValue;
`
// Sampled in the floor's own texture space, so the pattern sits on the stone or the grain
const DISSOLVE_MASK = /* glsl */ `
  dissolveValue = texture2D(uNoise, vMapUv * 0.45).r;
  if (dissolveValue > uDissolve) discard;
`
const DISSOLVE_EDGE = /* glsl */ `
  float dissolveBand = 1.0 - smoothstep(0.0, 0.05, uDissolve - dissolveValue);
  totalEmissiveRadiance += uEdge * dissolveBand * step(0.002, uDissolve) * (1.0 - step(0.998, uDissolve)) * 2.0;
`

const RIPPLES = 28

/** Rings spreading where rain lands on the stone, each on its own clock. */
function Ripples({ state, still, motion }: { state: RefObject<SceneState>; still: boolean; motion: RefObject<ScrollMotion> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colour = useMemo(() => new THREE.Color(), [])
  const drops = useMemo(() => {
    const random = createRandom("klin:ripples")
    return Array.from({ length: RIPPLES }, () => ({ x: (random() - 0.5) * 6, y: (random() - 0.5) * 6, phase: random(), period: 1.1 + random() * 1.4 }))
  }, [])
  // Rings spread faster while the page races
  const time = useRef(0.5)
  useFrame((_, delta) => {
    const s = state.current
    if (!mesh.current || !s) return
    const strength = s.stone * s.rain
    mesh.current.visible = strength > 0.01
    if (!still) time.current += Math.min(delta, 1 / 20) * (1 + stir(motion.current) * 2)
    if (mesh.current.visible) placeRipples(mesh.current, dummy, colour, drops, time.current, strength)
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, RIPPLES]} position-z={0.006} visible={false}>
      <ringGeometry args={[0.86, 1, 40]} />
      <meshBasicMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

function placeRipples(
  mesh: THREE.InstancedMesh,
  dummy: THREE.Object3D,
  colour: THREE.Color,
  drops: readonly { x: number; y: number; phase: number; period: number }[],
  t: number,
  strength: number,
) {
  drops.forEach((drop, i) => {
    const age = (((t / drop.period + drop.phase) % 1) + 1) % 1
    dummy.position.set(drop.x, drop.y, 0)
    dummy.scale.setScalar(0.04 + age * 0.38)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, colour.setRGB(0.55, 0.7, 0.78).multiplyScalar((1 - age) * (1 - age) * strength * 0.9))
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

const RAIN_DROPS = 520

/** Moves every streak down its slant, wrapping drops that leave the bottom back to the top. */
function stepRain(geometry: THREE.BufferGeometry, speeds: Float32Array, dt: number) {
  const positions = geometry.attributes.position.array as Float32Array
  for (let i = 0; i < speeds.length; i++) {
    const fall = speeds[i] * dt
    for (const offset of [1, 4]) positions[i * 6 + offset] -= fall
    for (const offset of [0, 3]) positions[i * 6 + offset] -= fall * 0.18
    if (positions[i * 6 + 4] < -5) {
      for (const offset of [1, 4]) positions[i * 6 + offset] += 10
      for (const offset of [0, 3]) positions[i * 6 + offset] += 1.8
    }
  }
  geometry.attributes.position.needsUpdate = true
}

function leanRain(sheet: THREE.Group, rush: number, pour: number) {
  sheet.scale.y = 1 + pour * 1.4
  sheet.rotation.z = -rush * 0.22
}

/** Thin streaks falling at a slant: heavy in the storm, steady over the stone. */
function Rain({ state, still, motion }: { state: RefObject<SceneState>; still: boolean; motion: RefObject<ScrollMotion> }) {
  const material = useRef<THREE.LineBasicMaterial>(null)
  const sheet = useRef<THREE.Group>(null)
  const { geometry, speeds } = useMemo(() => {
    const random = createRandom("klin:rain")
    const positions = new Float32Array(RAIN_DROPS * 6)
    const speeds = new Float32Array(RAIN_DROPS)
    for (let i = 0; i < RAIN_DROPS; i++) {
      const x = (random() - 0.5) * 14
      const y = (random() - 0.5) * 10
      const z = (random() - 0.5) * 6 - 1
      const length = 0.18 + random() * 0.3
      positions.set([x, y, z, x - length * 0.18, y - length, z], i * 6)
      speeds[i] = 5 + random() * 4
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return { geometry, speeds }
  }, [])

  useFrame((_, delta) => {
    const s = state.current
    const strength = s ? Math.max(s.rain, s.storm) : 0
    if (material.current) material.current.opacity = 0.45 * strength
    if (still || strength < 0.01) return
    // Racing down the page the rain streaks stretch, slant and fall harder; it settles when the page stops
    // The scroll leans the rain; the scroll or a note makes it pour
    const rush = motion.current.speed
    const pour = stir(motion.current)
    if (sheet.current) leanRain(sheet.current, rush, pour)
    stepRain(geometry, speeds, Math.min(delta, 1 / 20) * (1 + (s?.storm ?? 0) * 0.6 + pour * 1.8))
  })

  return (
    <group ref={sheet}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial ref={material} color="#cfe3ea" transparent opacity={0} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

interface Puff {
  x: number
  y: number
  z: number
  size: number
  speed: number
  spin: number
  phase: number
}

function puffs(seed: string, count: number, spread: [number, number, number], size: [number, number]): Puff[] {
  const random = createRandom(seed)
  return Array.from({ length: count }, () => ({
    x: (random() - 0.5) * spread[0],
    y: (random() - 0.5) * spread[1],
    z: (random() - 0.5) * spread[2] - 1.5,
    size: size[0] + random() * (size[1] - size[0]),
    speed: 0.05 + random() * 0.12,
    spin: (random() - 0.5) * 0.3,
    phase: random() * Math.PI * 2,
  }))
}

/** Lays soft discs out at time t, drifting (mist) or rising and swelling (smoke), lit to `colour`. */
function placePuffs(
  mesh: THREE.InstancedMesh,
  dummy: THREE.Object3D,
  tint: THREE.Color,
  list: readonly Puff[],
  t: number,
  strength: number,
  rise: boolean,
  colour: string,
  centreX: number,
) {
  list.forEach((puff, i) => {
    const life = rise ? (((t * puff.speed + puff.phase / 6) % 1) + 1) % 1 : 0.5
    const x = centreX + puff.x + (rise ? Math.sin(t * 0.6 + puff.phase) * 0.35 * life : Math.sin(t * puff.speed + puff.phase) * 1.2)
    const y = rise ? -1.2 + life * 4.2 : puff.y
    dummy.position.set(x, y, puff.z)
    dummy.rotation.set(0, 0, puff.phase + t * puff.spin)
    const grow = rise ? 0.4 + life * 1.1 : 1
    // Smoke rises in tall thin wisps; mist lies in wide banks
    dummy.scale.set(puff.size * grow * (rise ? 0.8 : 1.6), puff.size * grow * (rise ? 1.25 : 1), 1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    const fade = rise ? Math.sin(life * Math.PI) : 1
    mesh.setColorAt(i, tint.set(colour).multiplyScalar(fade * strength))
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

const MIST = 14

/** Banks of cloud drifting behind the bottle in the storm. */
function Mist({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])
  const texture = useMemo(() => softDisc(), [])
  const list = useMemo(() => puffs("klin:mist", MIST, [8, 5, 3], [2.2, 4]), [])
  useFrame(({ clock, size }) => {
    const s = state.current
    if (!mesh.current || !s) return
    mesh.current.visible = s.storm > 0.01
    const narrow = size.width < 768
    const strength = s.storm * (narrow ? 0.06 : 0.075)
    // Centred on the bottle (the camera aims there), so the brightest cloud stays behind it, not the headline
    if (mesh.current.visible) placePuffs(mesh.current, dummy, tint, list, still ? 0 : clock.elapsedTime, strength, false, "#9fb6c2", narrow ? 0 : 1.35)
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MIST]} visible={false}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

const SMOKE = 26

/** Incense smoke curling up past the bottle in the agarwood chapter. */
function Smoke({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])
  const texture = useMemo(() => softDisc(), [])
  const list = useMemo(() => puffs("klin:smoke", SMOKE, [3.5, 0, 1.5], [0.8, 1.6]), [])
  useFrame(({ clock, size }) => {
    const s = state.current
    if (!mesh.current || !s) return
    mesh.current.visible = s.embers > 0.01
    const centreX = size.width < 768 ? 0 : 1.35 * (1 - s.lineup)
    if (mesh.current.visible) placePuffs(mesh.current, dummy, tint, list, still ? 2 : clock.elapsedTime, s.embers * 0.09, true, "#b9a08c", centreX)
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SMOKE]} visible={false}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

/**
 * Strings of market bulbs behind the bottle in the jasmine chapter, drawn as
 * out-of-focus discs (bright rim, softer middle, as a lens renders a point of
 * light), each twinkling on its own; the strings sway, more when the page races.
 */
function Bulbs({ state, still, motion }: { state: RefObject<SceneState>; still: boolean; motion: RefObject<ScrollMotion> }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const points = useRef<THREE.Points>(null)
  const { size } = useThree()
  const narrow = size.width < 768
  const geometry = useMemo(() => {
    // Strung behind the bottle's shoulders: lower on phones, where the bottle sits high on the screen
    const bulbs = bulbStrings(narrow ? 0 : 1.35, narrow ? 7 : 13, narrow ? -1.3 : 0.2)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(bulbs.flatMap((bulb) => [bulb.x, bulb.y, bulb.z]), 3))
    const warm = new THREE.Color("#ffb35c")
    const pale = new THREE.Color("#ffe6b0")
    geometry.setAttribute("aColour", new THREE.Float32BufferAttribute(bulbs.flatMap((bulb) => pale.clone().lerp(warm, bulb.warmth).toArray()), 3))
    geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(bulbs.map((bulb) => bulb.size), 1))
    geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(bulbs.map((bulb) => bulb.phase), 1))
    geometry.setAttribute("aSwing", new THREE.Float32BufferAttribute(bulbs.map((bulb) => bulb.swing), 1))
    return geometry
  }, [narrow])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uStrength: { value: 0 }, uSway: { value: 0.05 }, uScale: { value: 300 }, uMap: { value: bokehDisc() } }),
    [],
  )
  useFrame(({ clock, size: viewport, gl }, delta) => {
    const s = state.current
    if (!points.current || !material.current || !s) return
    points.current.visible = s.petals > 0.01
    if (points.current.visible) setBulbs(material.current, still ? 0 : clock.elapsedTime, s.petals, stir(motion.current), viewport.height * gl.getPixelRatio(), delta)
  })
  return (
    <points ref={points} geometry={geometry} visible={false} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={BULB_VERTEX}
        fragmentShader={BULB_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function setBulbs(material: THREE.ShaderMaterial, time: number, strength: number, rush: number, pixels: number, delta: number) {
  material.uniforms.uTime.value = time
  material.uniforms.uStrength.value = strength
  material.uniforms.uScale.value = pixels * 0.42
  material.uniforms.uSway.value = THREE.MathUtils.damp(material.uniforms.uSway.value, 0.05 + rush * 0.25, 4, Math.min(delta, 1 / 20))
}

let bokeh: THREE.CanvasTexture | null = null
/** A point of light out of focus: a disc with a brighter rim and a softer middle. */
function bokehDisc(): THREE.CanvasTexture {
  if (!bokeh) {
    const size = 128
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const context = canvas.getContext("2d")!
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, "rgba(255,255,255,0.45)")
    gradient.addColorStop(0.72, "rgba(255,255,255,0.6)")
    gradient.addColorStop(0.86, "rgba(255,255,255,0.95)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
    bokeh = new THREE.CanvasTexture(canvas)
  }
  return bokeh
}

const BULB_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSway;
  uniform float uScale;
  attribute vec3 aColour;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSwing;
  varying vec3 vColour;
  varying float vGlow;
  void main() {
    vec3 p = position;
    // The middle of each string swings most, slowly, each bulb a little out of step
    p.x += sin(uTime * 0.7 + aPhase * 0.3) * uSway * aSwing;
    p.y += cos(uTime * 0.9 + aPhase * 0.3) * uSway * 0.3 * aSwing;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * uScale / -view.z;
    vColour = aColour;
    vGlow = 0.78 + 0.22 * sin(uTime * 1.7 + aPhase);
  }
`
const BULB_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uStrength;
  varying vec3 vColour;
  varying float vGlow;
  void main() {
    vec4 disc = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColour * vGlow * 1.25, disc.a * uStrength);
  }
`

const PETALS = 90

interface Orbit {
  radius: number
  height: number
  speed: number
  phase: number
  spin: number
  size: number
}

/** Sets each petal on its orbit at time t, tumbling, sized by the chapter's strength. */
function placePetals(mesh: THREE.InstancedMesh, dummy: THREE.Object3D, orbits: readonly Orbit[], t: number, strength: number, centreX: number, scatter = 1) {
  orbits.forEach((orbit, i) => {
    const angle = orbit.phase + t * orbit.speed
    const radius = orbit.radius * scatter
    dummy.position.set(centreX + Math.cos(angle) * radius, orbit.height * scatter + Math.sin(t * 0.6 + orbit.phase) * 0.25, Math.sin(angle) * radius - 0.5)
    dummy.rotation.set(orbit.spin + t * 0.8, angle, orbit.spin * 0.5 + t * 0.4)
    dummy.scale.setScalar(orbit.size * strength)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

/** Jasmine petals circling the bottle on slow, uneven orbits. */
function Petals({ state, still, motion }: { state: RefObject<SceneState>; still: boolean; motion: RefObject<ScrollMotion> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const orbits = useMemo(() => {
    const random = createRandom("klin:petals")
    return Array.from({ length: PETALS }, (): Orbit => ({
      radius: 1.2 + random() * 2.6,
      height: (random() - 0.5) * 4.5,
      speed: 0.15 + random() * 0.35,
      phase: random() * Math.PI * 2,
      spin: random() * Math.PI * 2,
      size: 0.6 + random() * 0.6,
    }))
  }, [])
  const geometry = useMemo(() => {
    // A small cupped oval, the shape of a single jasmine petal
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(0.08, 0.05, 0.09, 0.18, 0, 0.26)
    shape.bezierCurveTo(-0.09, 0.18, -0.08, 0.05, 0, 0)
    const petal = new THREE.ShapeGeometry(shape, 8)
    const positions = petal.attributes.position
    for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.pow(positions.getX(i) * 6, 2) * 0.04)
    petal.computeVertexNormals()
    return petal
  }, [])
  const time = useRef(0)
  const scatter = useRef(1)

  useFrame(({ size }, delta) => {
    const s = state.current
    const strength = s?.petals ?? 0
    if (!mesh.current) return
    mesh.current.visible = strength > 0.01
    if (!mesh.current.visible) return
    // A racing scroll scatters the petals wider and whirls them faster
    const rush = stir(motion.current)
    if (!still) time.current += Math.min(delta, 1 / 20) * (1 + rush * 2.5)
    scatter.current = THREE.MathUtils.damp(scatter.current, 1 + rush * 0.7, 6, Math.min(delta, 1 / 20))
    const centreX = size.width < 768 ? 0 : s && s.lineup < 0.5 ? 1.35 : 0
    placePetals(mesh.current, dummy, orbits, time.current, strength, centreX, scatter.current)
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, PETALS]} visible={false}>
      <meshStandardMaterial color="#f7f1df" roughness={0.6} side={THREE.DoubleSide} emissive="#4a3e28" />
    </instancedMesh>
  )
}

const EMBERS = 260

/** Lifts each spark at its own pace with a little sideways sway, wrapping at the top. */
function stepEmbers(geometry: THREE.BufferGeometry, drift: Float32Array, dt: number, t: number) {
  const positions = geometry.attributes.position.array as Float32Array
  for (let i = 0; i < drift.length / 2; i++) {
    positions[i * 3 + 1] += drift[i * 2] * dt
    positions[i * 3] += Math.sin(t * 0.9 + drift[i * 2 + 1]) * dt * 0.18
    if (positions[i * 3 + 1] > 4) positions[i * 3 + 1] -= 8
  }
  geometry.attributes.position.needsUpdate = true
}

/** Sparks rising like incense embers; bright enough to bloom. */
function Embers({ state, still, motion }: { state: RefObject<SceneState>; still: boolean; motion: RefObject<ScrollMotion> }) {
  const material = useRef<THREE.PointsMaterial>(null)
  const { geometry, drift } = useMemo(() => {
    const random = createRandom("klin:embers")
    const positions = new Float32Array(EMBERS * 3)
    const drift = new Float32Array(EMBERS * 2)
    for (let i = 0; i < EMBERS; i++) {
      positions.set([(random() - 0.5) * 10, (random() - 0.5) * 8, (random() - 0.5) * 5 - 1], i * 3)
      drift.set([0.25 + random() * 0.6, random() * Math.PI * 2], i * 2)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return { geometry, drift }
  }, [])
  const time = useRef(0)

  useFrame((_, delta) => {
    const strength = state.current?.embers ?? 0
    if (material.current) material.current.opacity = strength
    if (still || strength < 0.01) return
    // Sparks fly up faster while the page races
    const dt = Math.min(delta, 1 / 20) * (1 + stir(motion.current) * 2)
    time.current += dt
    stepEmbers(geometry, drift, dt, time.current)
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial ref={material} color="#ffc27a" size={0.055} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  )
}
