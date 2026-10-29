import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import { showcases } from "@/config/site"
import { localePath, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"

/**
 * Real screens from the live apps, fanned out beside the hero text. Each one
 * opens its app. The cards spread out of a stack on load, fan a little wider on
 * hover, and the whole stack tilts in 3D toward the pointer with each screen at
 * its own depth (all off for reduced motion). New apps join automatically once
 * they're live with screenshots.
 */
export function HeroShowcase({ locale }: { locale: Locale }) {
  const t = portalMessages[locale].hero
  const live = showcases.filter((showcase) => showcase.status === "live" && showcase.images && showcase.href)
  if (live.length === 0) return null
  const [front, back] = live
  const phone = live[0]

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
    <div className="group/fan relative mx-auto aspect-[5/4] w-[92%] max-w-md lg:w-full lg:max-w-none" data-testid="hero-showcase">
      {/* Tilts toward the pointer (vars set on the hero by HeroSpotlight); cards sit at different depths, so they shift like layers. */}
      <div className="hero-tilt absolute inset-0" data-testid="hero-tilt">
      {cards.map(({ showcase, style, className }) => (
        <Link
          key={showcase.id}
          href={localePath(locale, showcase.href!)}
          aria-label={t.openApp(showcase.name)}
          style={style}
          className={cn(
            "fan-card absolute overflow-clip rounded-xl border border-border bg-card shadow-xl focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
            className,
          )}
        >
          <Image
            src={showcase.images!.desktop[locale]}
            alt=""
            width={1440}
            height={900}
            sizes="(min-width: 1024px) 420px, 80vw"
            loading="eager"
            className="aspect-[16/10] w-full object-cover object-left-top"
          />
        </Link>
      ))}
      <Link
        href={localePath(locale, phone.href!)}
        aria-label={t.openApp(phone.name)}
        style={{ "--fan": "translateZ(70px) rotate(4deg)", "--fan-hover": "translate3d(-6%, -6%, 70px) rotate(1deg)", "--i": 2 } as CSSProperties}
        className="fan-card absolute right-[6%] bottom-0 w-[27%] overflow-clip rounded-[1.1rem] border-[3px] border-foreground/85 bg-card shadow-2xl focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Image src={phone.images!.mobile[locale]} alt="" width={393} height={659} sizes="140px" loading="eager" className="w-full" />
      </Link>
      </div>
    </div>
  )
}
