import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"
import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import { localePath, type Locale } from "@/i18n/config"
import { products } from "../../data/products"
import { shop } from "../../data/shop"
import { shopMessages } from "../../i18n/messages"
import { formatMinutes, formatNumber } from "../../lib/format"
import { CoffeeBag } from "../coffee-bag"
import { ProductCard } from "../product-card"

export function ShopHero({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  const [lead, second] = products.filter((product) => product.featured)

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-24">
        <div className="flex flex-col gap-6">
          <h1
            id="hero-title"
            className="font-heading text-[2.75rem] leading-[0.98] font-extrabold tracking-[-0.03em] [font-stretch:115%] sm:text-6xl lg:text-7xl"
          >
            <Phrased text={t.hero.title} />
          </h1>
          <p className="max-w-[36rem] text-lg leading-relaxed text-muted-foreground">{t.hero.body}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="xl">
              <Link href={localePath(locale, "/shop/coffee")}>{t.hero.shop}</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href="#cafe">{t.hero.visit}</a>
            </Button>
          </div>
        </div>

        <figure className="relative mx-auto flex w-full max-w-md flex-col items-center gap-5">
          <div className="relative w-full">
            {second && (
              <CoffeeBag product={second} locale={locale} className="absolute top-6 -right-6 w-[72%] rotate-[7deg] opacity-95" />
            )}
            <CoffeeBag product={lead} locale={locale} className="relative w-[78%] -rotate-[4deg]" />
          </div>
          <figcaption className="flex flex-col items-center gap-1 text-center text-sm">
            <span className="font-medium">
              {t.hero.thisWeek}: {lead.name}
            </span>
            <span className="text-muted-foreground">{lead.notes[locale].join(", ")}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export function CoffeeGrid({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  return (
    <section id="coffee" aria-labelledby="coffee-title" className="scroll-mt-20 border-t border-border bg-fog/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 id="coffee-title" className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">
            {t.coffee.title}
          </h2>
          <p className="text-muted-foreground">{t.coffee.intro}</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.filter((product) => product.featured || product.limited).map((product) => (
            <li key={product.id}>
              <ProductCard product={product} locale={locale} />
            </li>
          ))}
        </ul>
        <div>
          <Button asChild size="xl" variant="outline">
            <Link href={localePath(locale, "/shop/coffee")}>{t.catalog.seeAll}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

const ALT_MIN = 800
const ALT_MAX = 1600
const ticks = [900, 1100, 1300, 1500]
const pct = (metres: number) => `${((metres - ALT_MIN) / (ALT_MAX - ALT_MIN)) * 100}%`

/** Range bars of each farm's altitude band, highest first. Every range is labelled, so no tooltip is needed. */
export function FarmsSection({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  const farms = products
    .filter((product) => product.kind === "beans" && !product.origin.farm.en.includes(" and "))
    .sort((a, b) => b.origin.altitude[1] - a.origin.altitude[1] || b.origin.altitude[0] - a.origin.altitude[0])

  return (
    <section id="farms" aria-labelledby="farms-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:py-24">
        <div className="flex flex-col gap-3">
          <h2 id="farms-title" className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">
            {t.farms.title}
          </h2>
          <p className="text-muted-foreground">{t.farms.intro}</p>
        </div>
        <figure className="flex flex-col gap-2">
          <figcaption className="sr-only">{t.farms.chart}</figcaption>
          <ul className="flex flex-col">
            {farms.map((product) => {
              const [low, high] = product.origin.altitude
              return (
                <li key={product.id} className="grid grid-cols-1 gap-1 border-b border-border py-3 sm:grid-cols-[13rem_1fr] sm:items-center sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.origin.farm[locale]}</p>
                    <p className="truncate text-xs text-muted-foreground">{product.name}</p>
                  </div>
                  <div className="relative h-7">
                    <span className="absolute inset-y-3 right-0 left-0 rounded-full bg-muted" aria-hidden="true" />
                    <span
                      className="absolute inset-y-2 rounded-full bg-leaf"
                      style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
                      aria-hidden="true"
                    />
                    {/* Labels sit after the bar, or before it when the bar reaches the right edge. */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 px-2 text-xs whitespace-nowrap tabular-nums"
                      style={
                        (high - ALT_MIN) / (ALT_MAX - ALT_MIN) > 0.72
                          ? { right: `calc(100% - ${pct(low)})` }
                          : { left: pct(high) }
                      }
                    >
                      {t.product.altitude(low, high)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="relative ml-0 h-5 text-xs text-muted-foreground sm:ml-[14rem]" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pct(tick) }}>
                {t.farms.altitudeAxis(formatNumber(tick))}
              </span>
            ))}
          </div>
        </figure>
      </div>
    </section>
  )
}

export function CafeSection({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  return (
    <section id="cafe" aria-labelledby="cafe-title" className="scroll-mt-20 bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col gap-4">
          <h2 id="cafe-title" className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">
            {t.cafe.title}
          </h2>
          <p className="max-w-md text-lg opacity-80">{t.cafe.body}</p>
        </div>
        <div className="flex flex-col gap-8">
          <dl className="grid gap-6 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="opacity-70">{t.cafe.address}</dt>
              <dd className="text-base">
                {shop.address.line1[locale]}
                <br />
                {shop.address.line2[locale]}
                <br />
                {shop.address.city[locale]}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="opacity-70">{t.cafe.hours}</dt>
              <dd className="text-base tabular-nums">
                {t.cafe.daily(formatMinutes(shop.hours.open), formatMinutes(shop.hours.close))}
                <br />
                {shop.closedDay[locale]}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="opacity-70">{t.cafe.phone}</dt>
              <dd className="text-base">
                <a href={shop.phoneHref} className="underline-offset-4 hover:underline">
                  {shop.phone}
                </a>
              </dd>
            </div>
          </dl>
          <div>
            <Button asChild variant="secondary" size="lg">
              <a href="https://maps.google.com/?q=Nimmanhaemin+Soi+13+Chiang+Mai" target="_blank" rel="noreferrer">
                {t.cafe.maps}
                <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ShopFooter({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-extrabold text-foreground [font-stretch:125%]" translate="no">
            {shop.name}
          </p>
          <p>{shop.tagline[locale]}</p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <p>
            {t.footer.contact}:{" "}
            <a className="hover:text-foreground" href={`mailto:${shop.email}`}>
              {shop.email}
            </a>
          </p>
          <Link className="hover:text-foreground" href={localePath(locale, "/shop/orders")}>
            {t.orders.link}
          </Link>
          <Link className="hover:text-foreground" href={localePath(locale, "/shop/admin")}>
            {t.footer.staff}
          </Link>
          <p>
            © {shop.name}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
