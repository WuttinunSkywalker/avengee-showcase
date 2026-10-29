"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"

/**
 * A div that gets data-inview the first time it scrolls into view, so its
 * children can transition in with `group-data-[inview]` (pair with the `group`
 * class). Transitions rather than timed animations, so frozen-clock tests and
 * screenshots still settle. Without JS the attribute is never set, so style
 * the "in view" state as the default for reduced motion.
 */
export function InView({ threshold = 0.25, ...props }: ComponentProps<"div"> & { threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.disconnect()
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return <div ref={ref} data-inview={inView || undefined} {...props} />
}
