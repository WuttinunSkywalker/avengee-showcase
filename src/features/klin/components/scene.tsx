"use client"

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, MeshReflectorMaterial, MeshTransmissionMaterial, Sparkles, useTexture } from "@react-three/drei"
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import * as THREE from "three"
import { createRandom } from "@/lib/random"
import { scents, type ScentId } from "../data/scents"
import { bottleProfile, liquidProfile, sizeFactors } from "../lib/bottle"
import { valueNoise } from "../lib/noise"
import { coastBoard, type BottleSlot, type SpinBoard } from "../lib/spin"
import { CAMERA_SHOTS, cameraShot, isSoftwareRenderer, lightning, mixHex, nearestTurn, nextTier, stalling, type CameraShot, type SceneState, type Tier } from "../lib/story"

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
  speed: number
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
  const [tier, setTier] = useState<Tier>(() => (softwareWebGL() ? "still" : "light"))
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
    >
      <Backdrop state={state} still={still} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <pointLight position={[-3, 1.5, 2]} intensity={12} distance={9} color="#ffd7a0" />
      {/* A studio of soft light panels built on the GPU, so the glass has something to reflect without an HDR download */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, -2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffcf9e" position={[4, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 0, 4]} scale={2} />
      </Environment>
      {!still && <Governor rich={rich} tier={tier} onChange={setTier} />}
      <Story state={state} still={still} calm={reduced} rich={tier === "full"} size={size} spin={spin} motion={motion} onReady={onReady} />
      {tier === "full" && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.25} />
          <Noise opacity={0.035} premultiply />
          <Vignette offset={0.28} darkness={0.62} />
        </EffectComposer>
      )}
    </Canvas>
  )
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
    const lineupScale = narrow ? 0.36 : 0.68
    const spread = narrow ? 0.34 : 1
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

    // The other two bottles join for the line-up, monsoon on the left and jasmine in the middle
    for (const [group, slot, name] of [[left, -1, "left"], [middle, 0, "middle"]] as const) {
      if (!group.current) continue
      const k = THREE.MathUtils.smoothstep(lineup, 0.15 + (slot + 1) * 0.2, 0.75 + (slot + 1) * 0.1)
      group.current.visible = k > 0.001
      group.current.position.set(slot * SLOT * spread, LINEUP_Y - (1 - k) * 1.5, 0)
      group.current.scale.setScalar(lineupScale * k)
      if (showing(name)) group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, nearestTurn(group.current.rotation.y, path.azimuth), 6, dt)
      else group.current.rotation.y += (still ? 0 : dt * 0.25) + board[name].angle - spun.current[name]
      spun.current[name] = board[name].angle
      if (isLifted(board, name)) group.current.position.y += 0.09 * lineupScale
    }

    // The camera aims at the middle of the resting bottle (not its rise or bob) or of the line-up
    const sway = still ? 0 : Math.sin(clock.elapsedTime * 0.12) * 0.03 + pointer.current.x * 0.05
    const shot = { ...path, azimuth: path.azimuth + sway, radius: path.radius * (narrow ? THREE.MathUtils.lerp(1, 1.12, lineup) : 1) }
    aim.set(THREE.MathUtils.lerp(narrow ? 0 : 1.35, 0, lineup), THREE.MathUtils.lerp(baseY + 0.585 * scale, LINEUP_Y + 0.585 * lineupScale, lineup), 0)
    frameCamera(camera as THREE.PerspectiveCamera, shot, aim, s.exit, {
      width: viewport.width,
      height: viewport.height,
      // Wide screens: the bottle in the right third beside the text, then the line-up centred above the
      // collection cards. Phones: always in the upper part of the screen, above the text panels.
      x: narrow ? 0 : -0.21 * viewport.width * (1 - lineup),
      y: (narrow ? 0.24 : 0.2 * lineup) * viewport.height,
    })
  })

  return (
    <>
      <group ref={hero}>
        <group ref={shape}>
          <Bottle liquidRef={heroLiquid} liquid={scents[0].liquid} rich={rich} slot="hero" engraving={engraving} />
        </group>
        <Beam state={state} still={still} />
      </group>
      <group ref={left} visible={false}>
        <group ref={leftShape}>
          <Bottle liquid={scents[0].liquid} rich={false} slot="left" engraving={engraving} />
        </group>
      </group>
      <group ref={middle} visible={false}>
        <group ref={middleShape}>
          <Bottle liquid={scents[1].liquid} rich={false} slot="middle" engraving={engraving} />
        </group>
      </group>
      <group ref={stage}>
        <Suspense fallback={null}>
          <Floors state={state} still={still} rich={rich} motion={motion} onReady={onReady} />
        </Suspense>
      </group>
      <Rain state={state} still={still} motion={motion} />
      <Mist state={state} still={still} />
      <Petals state={state} still={still} motion={motion} />
      <Embers state={state} still={still} motion={motion} />
      <Smoke state={state} still={still} />
    </>
  )
}

/** A heavy glass flacon turned on a lathe, its juice inside, a brass collar and cap, and the house name engraved in gold. */
function Bottle({
  liquid,
  liquidRef,
  rich,
  slot,
  engraving,
}: {
  liquid: string
  liquidRef?: RefObject<THREE.MeshPhysicalMaterial | null>
  rich: boolean
  slot: Slot
  engraving: EngravingSource
}) {
  const glass = useMemo(() => new THREE.LatheGeometry(bottleProfile().map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  const juice = useMemo(() => new THREE.LatheGeometry(liquidProfile().map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  return (
    <group position={[0, -0.6, 0]}>
      <mesh geometry={juice} renderOrder={1}>
        <meshPhysicalMaterial ref={liquidRef} color={liquid} roughness={0.12} transmission={0.5} thickness={1.2} ior={1.35} transparent opacity={0.94} />
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
    if (!still) time.current += Math.min(delta, 1 / 20) * (1 + Math.abs(motion.current.speed) * 2)
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

function leanRain(sheet: THREE.Group, rush: number) {
  sheet.scale.y = 1 + Math.abs(rush) * 1.4
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
    const rush = motion.current.speed
    if (sheet.current) leanRain(sheet.current, rush)
    stepRain(geometry, speeds, Math.min(delta, 1 / 20) * (1 + (s?.storm ?? 0) * 0.6 + Math.abs(rush) * 1.8))
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
    const rush = Math.abs(motion.current.speed)
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
    const dt = Math.min(delta, 1 / 20) * (1 + Math.abs(motion.current.speed) * 2)
    time.current += dt
    stepEmbers(geometry, drift, dt, time.current)
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial ref={material} color="#ffc27a" size={0.055} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  )
}
