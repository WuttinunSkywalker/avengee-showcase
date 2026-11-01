"use client"

import { useEffect, useMemo, useRef, type RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import { scents } from "../data/scents"
import type { SceneState } from "../lib/story"
import { bottleProfile, liquidProfile } from "../lib/bottle"
import { createRandom } from "@/lib/random"

/**
 * The fixed WebGL layer behind the page: one glass bottle that turns and
 * changes colour with the scroll, the weather of each chapter around it, and
 * the collection line-up at the end. It only reads the scene state the page
 * writes into `state` on every scroll; nothing in it is needed to read or use
 * the page.
 */
export function KlinScene({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  return (
    <Canvas
      className="!fixed inset-0 !h-[100lvh] !w-full"
      style={{ pointerEvents: "none" }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 7], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={still ? "demand" : "always"}
      aria-hidden="true"
      data-testid="klin-canvas"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, 1.5, 2]} intensity={14} distance={9} color="#ffd7a0" />
      {/* A studio of soft light panels, built on the GPU, so the glass has something to reflect without loading an HDR file */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, -2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffcf9e" position={[4, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 0, 4]} scale={2} />
      </Environment>
      <Story state={state} still={still} />
    </Canvas>
  )
}

/**
 * Pulls the camera back for the line-up, and once the collection scrolls up
 * the screen raises it by the same share of its view, so the bottles leave with the page.
 */
function frameCamera(camera: THREE.PerspectiveCamera, distance: number, exit: number) {
  camera.position.z = distance
  const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  camera.position.y = 0.2 - exit * viewHeight
  camera.lookAt(0, camera.position.y - 0.2, 0)
}

const SLOT = 2.1
/** The line-up stands in the upper half of the screen, above the collection cards. */
const LINEUP_Y = 0.45

function Story({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const hero = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const middle = useRef<THREE.Group>(null)
  const heroLiquid = useRef<THREE.MeshPhysicalMaterial>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const intro = useRef(still ? 1 : 0)
  const { size, invalidate } = useThree()
  const narrow = size.width < 768

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: (event.clientX / window.innerWidth) * 2 - 1, y: (event.clientY / window.innerHeight) * 2 - 1 }
    }
    const onScroll = () => invalidate()
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("scroll", onScroll)
    }
  }, [invalidate])

  useFrame(({ camera, clock }, delta) => {
    const s = state.current
    if (!s || !hero.current) return
    const dt = Math.min(delta, 1 / 20)
    // The rise runs on the clock, not frame by frame, so a slow device still finishes it in 1.8 seconds
    if (intro.current < 1) intro.current = Math.min(1, clock.elapsedTime / 1.8)
    const rise = 1 - Math.pow(1 - intro.current, 3)

    // Phones keep the bottle higher and smaller, above the text panels
    const baseX = narrow ? 0 : 1.35
    // Framed with its cap clear of the header: the flacon is about 3 units tall in a view about 4 tall
    const baseY = narrow ? 0.6 : -0.85
    const scale = narrow ? 0.46 : 0.95
    const lineup = s.lineup
    const lineupScale = narrow ? 0.4 : 0.68
    const x = THREE.MathUtils.lerp(baseX, SLOT * (narrow ? 0.44 : 1), lineup)
    const y = THREE.MathUtils.lerp(baseY - (1 - rise) * 2.5, LINEUP_Y, lineup)
    hero.current.position.set(x, y, 0)
    hero.current.scale.setScalar(THREE.MathUtils.lerp(scale, lineupScale, lineup) * (0.85 + 0.15 * rise))
    const tilt = still ? 0 : 0.12
    hero.current.rotation.y = THREE.MathUtils.damp(hero.current.rotation.y, s.turn + pointer.current.x * tilt * 2, 6, dt)
    hero.current.rotation.x = THREE.MathUtils.damp(hero.current.rotation.x, pointer.current.y * tilt, 6, dt)
    hero.current.rotation.z = THREE.MathUtils.damp(hero.current.rotation.z, -pointer.current.x * tilt * 0.4, 6, dt)
    heroLiquid.current?.color.set(s.liquid)

    // The other two bottles join for the line-up, monsoon on the left and jasmine in the middle
    for (const [group, slot] of [[left, -1], [middle, 0]] as const) {
      if (!group.current) continue
      const k = THREE.MathUtils.smoothstep(lineup, 0.15 + (slot + 1) * 0.2, 0.75 + (slot + 1) * 0.1)
      group.current.visible = k > 0.001
      group.current.position.set(slot * SLOT * (narrow ? 0.44 : 1), LINEUP_Y - (1 - k) * 1.5, 0)
      group.current.scale.setScalar(lineupScale * k)
      group.current.rotation.y += still ? 0 : dt * 0.25
    }

    frameCamera(camera as THREE.PerspectiveCamera, THREE.MathUtils.lerp(7, narrow ? 8.5 : 7.6, lineup), s.exit)
  })

  return (
    <>
      <group ref={hero}>
        <Bottle liquidRef={heroLiquid} liquid={scents[0].liquid} />
      </group>
      <group ref={left} visible={false}>
        <Bottle liquid={scents[0].liquid} />
      </group>
      <group ref={middle} visible={false}>
        <Bottle liquid={scents[1].liquid} />
      </group>
      <Rain state={state} still={still} />
      <Petals state={state} still={still} />
      <Embers state={state} still={still} />
    </>
  )
}

/** A heavy glass flacon turned on a lathe, its juice inside and a brass collar and cap on top. */
function Bottle({ liquid, liquidRef }: { liquid: string; liquidRef?: RefObject<THREE.MeshPhysicalMaterial | null> }) {
  const glass = useMemo(() => new THREE.LatheGeometry(bottleProfile().map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  const juice = useMemo(() => new THREE.LatheGeometry(liquidProfile().map(([x, y]) => new THREE.Vector2(x, y)), 72), [])
  return (
    <group position={[0, -0.6, 0]}>
      <mesh geometry={juice} renderOrder={1}>
        <meshPhysicalMaterial ref={liquidRef} color={liquid} roughness={0.15} transmission={0.55} thickness={1.2} ior={1.35} transparent opacity={0.92} />
      </mesh>
      <mesh geometry={glass} renderOrder={2}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.04}
          metalness={0}
          transmission={1}
          thickness={0.45}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.5}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Collar and cap */}
      <mesh position={[0, 1.83, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 48]} />
        <meshStandardMaterial color="#c9a46a" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.12, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 6]} />
        <meshStandardMaterial color="#1c1714" metalness={0.3} roughness={0.35} />
      </mesh>
    </group>
  )
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

/** Thin streaks falling at a slant; their opacity follows the monsoon chapter. */
function Rain({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
  const material = useRef<THREE.LineBasicMaterial>(null)
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
    const strength = state.current?.rain ?? 0
    if (material.current) material.current.opacity = 0.45 * strength
    if (still || strength < 0.01) return
    stepRain(geometry, speeds, Math.min(delta, 1 / 20))
  })

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial ref={material} color="#cfe3ea" transparent opacity={0} depthWrite={false} />
    </lineSegments>
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
function placePetals(mesh: THREE.InstancedMesh, dummy: THREE.Object3D, orbits: readonly Orbit[], t: number, strength: number, centreX: number) {
  orbits.forEach((orbit, i) => {
    const angle = orbit.phase + t * orbit.speed
    dummy.position.set(centreX + Math.cos(angle) * orbit.radius, orbit.height + Math.sin(t * 0.6 + orbit.phase) * 0.25, Math.sin(angle) * orbit.radius - 0.5)
    dummy.rotation.set(orbit.spin + t * 0.8, angle, orbit.spin * 0.5 + t * 0.4)
    dummy.scale.setScalar(orbit.size * strength)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

/** Jasmine petals circling the bottle on slow, uneven orbits. */
function Petals({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
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

  useFrame((_, delta) => {
    const strength = state.current?.petals ?? 0
    if (!mesh.current) return
    mesh.current.visible = strength > 0.01
    if (!mesh.current.visible) return
    if (!still) time.current += Math.min(delta, 1 / 20)
    const heroX = state.current && state.current.lineup < 0.5 ? 1.35 : 0
    placePetals(mesh.current, dummy, orbits, time.current, strength, heroX)
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, PETALS]} visible={false}>
      <meshStandardMaterial color="#f7f1df" roughness={0.6} side={THREE.DoubleSide} emissive="#3a3020" />
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

/** Sparks and a haze of smoke-lit specks rising like incense. */
function Embers({ state, still }: { state: RefObject<SceneState>; still: boolean }) {
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
    if (material.current) material.current.opacity = 0.9 * strength
    if (still || strength < 0.01) return
    const dt = Math.min(delta, 1 / 20)
    time.current += dt
    stepEmbers(geometry, drift, dt, time.current)
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial ref={material} color="#ffb067" size={0.05} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
