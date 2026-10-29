"use client"

import { useEffect, type RefObject } from "react"

/**
 * Writes the pointer position inside `ref` to CSS variables (--px, --py as
 * pixels; --pxr, --pyr as -0.5…0.5 from the centre) and sets data-pointer while
 * hovered. Mouse and pen only, so touch scrolling stays native. Updates once
 * per frame and never re-renders React.
 */
export function usePointerVars(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let frame = 0
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect()
        const x = event.clientX - box.left
        const y = event.clientY - box.top
        node.style.setProperty("--px", `${x}px`)
        node.style.setProperty("--py", `${y}px`)
        node.style.setProperty("--pxr", (x / box.width - 0.5).toFixed(3))
        node.style.setProperty("--pyr", (y / box.height - 0.5).toFixed(3))
        node.dataset.pointer = ""
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      delete node.dataset.pointer
      node.style.setProperty("--pxr", "0")
      node.style.setProperty("--pyr", "0")
    }
    node.addEventListener("pointermove", move)
    node.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(frame)
      node.removeEventListener("pointermove", move)
      node.removeEventListener("pointerleave", leave)
    }
  }, [ref])
}
