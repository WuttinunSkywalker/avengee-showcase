import Image from "next/image"
import { AvengeeMark } from "@/features/portal/portal-header"
import { portalMessages } from "@/features/portal/messages"
import { spa } from "@/features/spa/data/spa"
import { spaMessages } from "@/features/spa/i18n/messages"
import { formatMinutes } from "@/features/spa/lib/time"
import { Phrased } from "@/components/phrased"
import { site } from "@/config/site"
import { CoffeeBag } from "@/features/shop/components/coffee-bag"
import { getProduct } from "@/features/shop/data/products"
import { shop } from "@/features/shop/data/shop"
import { shopMessages } from "@/features/shop/i18n/messages"
import { getDish, restaurant } from "@/features/restaurant/data/menu"
import { restaurantMessages } from "@/features/restaurant/i18n/messages"
import { ProjectDrawing } from "@/features/studio/components/project-drawing"
import { getProject, studio } from "@/features/studio/data/projects"
import { studioMessages } from "@/features/studio/i18n/messages"
import type { Locale } from "@/i18n/config"
import heroImage from "../../../public/images/spa/hero-frangipani.webp"

/**
 * 1200×630 share cards, rendered by the browser (so Thai tone marks stack
 * correctly) and captured to public/og by `pnpm capture:og`.
 */
export const ogCards = ["portal", "spa", "shop", "studio", "restaurant"] as const
export type OgCardId = (typeof ogCards)[number]

export function PortalOgCard({ locale }: { locale: Locale }) {
  const t = portalMessages[locale]
  return (
    <div className="relative flex size-full flex-col justify-between bg-background p-[72px] text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70"
      />
      <div className="relative flex items-center gap-5">
        <AvengeeMark className="size-16" />
        <span className="font-heading text-4xl font-semibold tracking-tight">{site.name}</span>
      </div>
      <h1 className="relative max-w-[1000px] font-heading text-[80px] leading-[1.02] font-semibold tracking-[-0.03em]">
        <Phrased text={t.hero.title} />
      </h1>
      <div className="relative flex items-center justify-between text-[28px] text-muted-foreground">
        <span>{t.showcases.title}</span>
        <span className="text-primary">{site.email}</span>
      </div>
    </div>
  )
}

export function SpaOgCard({ locale }: { locale: Locale }) {
  const t = spaMessages[locale]
  return (
    <div className="flex size-full bg-background text-foreground">
      <div className="flex w-[640px] flex-col justify-between p-16">
        <span className="font-heading text-4xl">{spa.name[locale]}</span>
        <h1 className={locale === "th" ? "font-heading text-[58px] leading-[1.3]" : "font-heading text-[68px] leading-[1.08]"}>
          <Phrased text={t.hero.title} />
        </h1>
        <div className="flex flex-col gap-1.5 text-2xl text-muted-foreground">
          <span>{t.nav.openDaily(formatMinutes(spa.hours.open), formatMinutes(spa.hours.close))}</span>
          <span>{spa.address.transit[locale]}</span>
        </div>
      </div>
      <Image src={heroImage} alt="" priority className="h-[630px] w-[560px] object-cover" />
    </div>
  )
}

export function ShopOgCard({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  return (
    <div className="flex size-full items-center gap-10 bg-background px-16 text-foreground">
      <div className="flex flex-1 flex-col gap-8">
        <span className="font-heading text-3xl font-extrabold [font-stretch:125%]">{shop.name}</span>
        <h1 className="font-heading text-[64px] leading-[1.02] font-extrabold tracking-[-0.03em] [font-stretch:112%]">
          <Phrased text={t.hero.title} />
        </h1>
        <span className="text-2xl text-muted-foreground">{t.shipping("฿1,000")}</span>
      </div>
      <div className="relative w-[360px] shrink-0">
        <CoffeeBag product={getProduct("doi-chang-washed")!} locale={locale} className="absolute top-4 -right-8 w-[80%] rotate-[7deg]" />
        <CoffeeBag product={getProduct("doi-pangkhon-natural")!} locale={locale} className="relative w-[86%] -rotate-[4deg]" />
      </div>
    </div>
  )
}

export function StudioOgCard({ locale }: { locale: Locale }) {
  const t = studioMessages[locale]
  const project = getProject("ari-house")!
  return (
    <div className="flex size-full items-center gap-12 bg-background px-16 text-foreground">
      <div className="flex w-[470px] shrink-0 flex-col gap-7">
        <span className="text-3xl font-medium tracking-tight">{studio.name}</span>
        <h1 className="text-[58px] leading-[1.05] font-light tracking-[-0.04em]">
          <Phrased text={t.hero.title} />
        </h1>
        <span className="text-2xl text-leaf">{t.tagline}</span>
      </div>
      <div className="flex flex-1 flex-col border border-foreground/80 bg-card">
        <div className="p-5">
          <ProjectDrawing project={project} view="elevation" labels={t.drawing} title="" />
        </div>
        <div className="grid grid-cols-3 border-t border-foreground/80 text-base">
          {[project.name[locale], t.lightbox.views.elevation, "1:100"].map((value, i) => (
            <span key={value} className={`px-4 py-2.5 ${i ? "border-l border-foreground/80" : ""}`}>
              {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RestaurantOgCard({ locale }: { locale: Locale }) {
  const t = restaurantMessages[locale]
  const plates = ["moo-krob-kra-pao", "tom-yum-goong", "som-tam", "mango-sticky-rice"].map((id) => getDish(id)!)
  return (
    <div className="flex size-full items-center gap-14 bg-background px-16 text-foreground">
      <div className="flex flex-1 flex-col gap-8">
        <span className="flex items-baseline gap-4">
          <span className="font-heading text-5xl font-semibold text-primary" lang="th">
            {restaurant.nameTh}
          </span>
          <span className="text-3xl text-muted-foreground">{restaurant.name}</span>
        </span>
        <h1 className={locale === "th" ? "font-heading text-[66px] leading-[1.25] font-semibold" : "font-heading text-[72px] leading-[1.05] font-semibold"}>
          <Phrased text={t.landing.title} />
        </h1>
        <span className="text-2xl text-muted-foreground">{t.tagline}</span>
      </div>
      <div className="relative grid w-[480px] shrink-0 grid-cols-2 gap-4">
        {plates.map((dish) => (
          <div key={dish.id} className="relative aspect-square overflow-hidden rounded-[28px]">
            <Image src={dish.image} alt="" fill sizes="240px" priority className="object-cover" />
          </div>
        ))}
        <span className="absolute top-1/2 left-1/2 -translate-1/2 rounded-full bg-signal px-7 py-3 font-heading text-3xl font-semibold text-signal-foreground shadow-lg">
          {t.table.label(7)}
        </span>
      </div>
    </div>
  )
}
