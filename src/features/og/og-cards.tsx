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
import type { Locale } from "@/i18n/config"
import heroImage from "../../../public/images/spa/hero-frangipani.webp"

/**
 * 1200×630 share cards, rendered by the browser (so Thai tone marks stack
 * correctly) and captured to public/og by `pnpm capture:og`.
 */
export const ogCards = ["portal", "spa", "shop"] as const
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
