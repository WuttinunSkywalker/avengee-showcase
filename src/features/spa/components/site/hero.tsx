import Image from "next/image"
import Link from "next/link"
import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import { localePath, type Locale } from "@/i18n/config"
import { spa } from "../../data/spa"
import { spaMessages } from "../../i18n/messages"
import { formatMinutes } from "../../lib/time"
import { NextAvailable } from "./next-available"
import heroImage from "../../../../../public/images/spa/hero-frangipani.webp"

export function Hero({ locale }: { locale: Locale }) {
  const t = spaMessages[locale]
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
        <div className="flex flex-col gap-6">
          <h1 id="hero-title" className="font-heading text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
            <Phrased text={t.hero.title} />
          </h1>
          <p className="max-w-[34rem] text-lg leading-relaxed text-muted-foreground">{spa.description[locale]}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="xl">
              <Link href={localePath(locale, "/spa/book")}>{t.nav.book}</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#treatments">{t.hero.seeMenu}</Link>
            </Button>
          </div>
          <dl className="grid max-w-md grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">{t.hero.openDaily}</dt>
              <dd className="font-medium tabular-nums">
                {formatMinutes(spa.hours.open)}–{formatMinutes(spa.hours.close)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.hero.gettingHere}</dt>
              <dd className="font-medium">{spa.address.transit[locale]}</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <Image
            src={heroImage}
            alt={t.hero.heroAlt}
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/3] w-full rounded-lg object-cover lg:aspect-[5/6]"
          />
          <div className="absolute right-4 bottom-4 left-4 rounded-lg border border-border bg-card/95 shadow-lg backdrop-blur sm:right-auto sm:w-80 lg:-left-10">
            <NextAvailable />
          </div>
        </div>
      </div>
    </section>
  )
}
