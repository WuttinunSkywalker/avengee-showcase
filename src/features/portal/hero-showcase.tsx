import Image from "next/image"
import type { CSSProperties } from "react"
import { showcases } from "@/config/site"
import type { Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"

/**
 * Real screens from the live apps, fanned out beside the hero text as a
 * picture (the showcase list below holds the links). The cards spread out of a stack on load, fan a little wider on
 * hover, and the whole stack tilts in 3D toward the pointer with each screen at
 * its own depth (all off for reduced motion). New apps join automatically once
 * they're live with screenshots.
 */
export function HeroShowcase({ locale }: { locale: Locale }) {
  const t = portalMessages[locale].hero
  const live = showcases.filter((showcase) => showcase.status === "live" && showcase.images && showcase.href)
  if (live.length === 0) return null
  // Apps can claim a place in the fan (the flagship in front); otherwise the first live apps fill it
  const slot = (place: "back" | "front" | "phone", fallback: number) => live.find((showcase) => showcase.hero === place) ?? live[fallback]
  const front = slot("front", 0)
  const back = live.length > 1 ? slot("back", 1) : undefined
  const phone = slot("phone", 0)

  // Rest and hover positions, read by .fan-card in globals.css.
  const cards: { showcase: (typeof live)[number]; style: CSSProperties; className: string }[] = [
    ...(back
      ? [
          {
            showcase: back,
            className: "top-0 right-0 w-[78%]",
            style: { "--fan": "translateZ(-50px) rotate(5deg)", "--fan-hover": "translate3d(4%, -4%, -50px) rotate(8deg)", "--i": 0 } as CSSProperties,
          },
        ]
      : []),
    {
      showcase: front,
      className: "top-[16%] left-0 w-[80%]",
      style: { "--fan": "translateZ(0) rotate(-3deg)", "--fan-hover": "translate3d(-3%, 2%, 0) rotate(-5deg)", "--i": 1 } as CSSProperties,
    },
  ]

  return (
    <div className="group/fan relative mx-auto aspect-[5/4] w-[92%] max-w-md lg:w-full lg:max-w-none" data-testid="hero-showcase" role="img" aria-label={t.showcaseLabel([...new Set([back, front, phone].filter(Boolean).map((showcase) => showcase!.name))])}>
      {/* Tilts toward the pointer (vars set on the hero by HeroSpotlight); cards sit at different depths, so they shift like layers. */}
      <div className="hero-tilt absolute inset-0" data-testid="hero-tilt">
      {cards.map(({ showcase, style, className }) => (
        <div key={showcase.id} style={style} className={cn("fan-card absolute overflow-clip rounded-xl border border-border bg-card shadow-xl", className)}>
          <Image
            src={showcase.images!.desktop[locale]}
            alt=""
            width={1440}
            height={900}
            sizes="(min-width: 1024px) 420px, 80vw"
            loading="eager"
            className="aspect-[16/10] w-full object-cover object-left-top"
          />
        </div>
      ))}
      <div
        style={{ "--fan": "translateZ(70px) rotate(4deg)", "--fan-hover": "translate3d(-6%, -6%, 70px) rotate(1deg)", "--i": 2 } as CSSProperties}
        className="fan-card absolute right-[6%] bottom-0 w-[27%] overflow-clip rounded-[1.1rem] border-[3px] border-foreground/85 bg-card shadow-2xl"
      >
        <Image src={phone.images!.mobile[locale]} alt="" width={393} height={659} sizes="140px" loading="eager" className="w-full" />
      </div>
      </div>
    </div>
  )
}
