"use client"

import { useRef, type PointerEvent, type RefObject } from "react"
import { holdBottle, pointAt, releaseBottle, turnBottle, type BottleSlot, type SpinBoard } from "../lib/spin"

/** Asks the 3D layer for a frame, for devices on still frames that only draw when something changes. */
export function pokeScene() {
  window.dispatchEvent(new Event("klin:poke"))
}

const zones: { id: string; slot: BottleSlot }[] = [
  { id: "single", slot: "hero" },
  { id: "line-left", slot: "left" },
  { id: "line-middle", slot: "middle" },
  { id: "line-right", slot: "hero" },
]

/**
 * Invisible handles over where the bottles are drawn (the 3D layer itself
 * takes no pointer events): drag sideways to spin a bottle, which coasts on and
 * slows after letting go; the mouse over one lifts it a little. Which handles
 * show depends on the stage the page sets (globals.css): one over the bottle
 * in the chapters, three over the line-up, none where the cards or the atelier
 * are. Vertical drags still scroll the page on touch screens.
 */
export function SpinZones({ board }: { board: RefObject<SpinBoard> }) {
  const drag = useRef<{ slot: BottleSlot; x: number; t: number } | null>(null)

  const release = () => {
    drag.current = null
    releaseBottle(board.current)
    pokeScene()
  }
  const handlers = (slot: BottleSlot) => ({
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { slot, x: event.clientX, t: event.timeStamp }
      holdBottle(board.current, slot)
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const held = drag.current
      if (!held || held.slot !== slot) return
      turnBottle(board.current, slot, event.clientX - held.x, (event.timeStamp - held.t) / 1000)
      drag.current = { slot, x: event.clientX, t: event.timeStamp }
      event.currentTarget.dataset.spun = ""
      pokeScene()
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerEnter: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") pointAt(board.current, slot)
    },
    onPointerLeave: () => {
      if (board.current.hover === slot) pointAt(board.current, null)
    },
  })

  return (
    <div className="klin-spin-zones" aria-hidden="true">
      {zones.map((zone) => (
        <div key={zone.id} className="klin-spin" data-zone={zone.id} data-testid={`spin-${zone.id}`} {...handlers(zone.slot)} />
      ))}
    </div>
  )
}
