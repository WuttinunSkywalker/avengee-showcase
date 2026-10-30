import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon, ClockIcon, StarIcon, TruckIcon } from "lucide-react"
import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import { localePath, type Locale } from "@/i18n/config"
import { formatBaht } from "@/lib/format"
import { getItem, items, type Item } from "../data/items"
import { getSeller, sellers, type Seller } from "../data/sellers"
import { marketplaceMessages } from "../i18n/messages"
import { sellerStock } from "../lib/search"
import { ItemCard, ListingPhoto } from "./item-card"
import { BuyBox } from "./buy-box"

const heroPieces = ["sangkhalok-lidded-jar", "pha-sin-gold-hem", "bencharong-bowl", "karen-carry-basket"]

export function HomeHero({ locale }: { locale: Locale }) {
  const t = marketplaceMessages[locale]
  const forSale = items.filter((item) => !item.sold).length
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
      <div className="flex flex-col gap-5">
        <h1 className={locale === "th" ? "font-heading text-4xl leading-[1.35] text-balance sm:text-5xl" : "font-heading text-4xl leading-[1.08] text-balance sm:text-6xl"}>
          <Phrased text={t.hero.title} />
        </h1>
        <p className="max-w-[52ch] text-lg text-muted-foreground text-pretty">
          <Phrased text={t.hero.body} />
        </p>
        <p className="text-sm font-medium text-primary">{t.hero.pieces(forSale)}</p>
      </div>
      <ul className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-3">
        {heroPieces.map((id, index) => {
          const item = getItem(id)!
          return (
            <li key={id} className={index % 2 ? "md:translate-y-6" : ""}>
              <Link
                href={localePath(locale, `/marketplace/items/${id}`)}
                className="group relative block aspect-square overflow-clip rounded-[var(--radius)] bg-plinth focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Image src={item.image} alt={item.name[locale]} fill priority sizes="(min-width: 768px) 25vw, 45vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.05]" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SellerFacts({ seller, locale }: { seller: Seller; locale: Locale }) {
  const t = marketplaceMessages[locale].seller
  const stock = sellerStock(seller.id)
  return (
    <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      <li className="flex items-center gap-2">
        <StarIcon className="size-4 fill-gilt text-gilt" aria-hidden="true" />
        <span className="font-medium text-foreground">{t.rating(seller.rating.toFixed(1), seller.reviews)}</span>
      </li>
      <li className="flex items-center gap-2">
        <ClockIcon className="size-4" aria-hidden="true" />
        {t.replies(seller.repliesWithin)}
      </li>
      <li>{t.stock(stock.forSale, stock.sold)}</li>
    </ul>
  )
}

export function DealerCards({ locale }: { locale: Locale }) {
  const t = marketplaceMessages[locale].seller
  return (
    <section id="dealers" aria-labelledby="dealers-heading" className="scroll-mt-24 border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="dealers-heading" className="font-heading text-3xl">
            {t.dealersTitle}
          </h2>
          <p className="text-muted-foreground">{t.dealersBody}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sellers.map((seller) => {
            const cover = items.find((item) => item.seller === seller.id && !item.sold)!
            return (
              <li key={seller.id} className="relative flex flex-col overflow-clip rounded-[var(--radius)] border border-border bg-card" data-testid="dealer-card">
                <div className="relative aspect-[16/9] bg-plinth">
                  <ListingPhoto item={cover} alt="" sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="font-heading text-xl">
                      <Link
                        href={localePath(locale, `/marketplace/dealers/${seller.id}`)}
                        className="rounded-sm after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {seller.name[locale]}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {seller.town[locale]}, {t.since(seller.since).toLowerCase()}
                    </p>
                  </div>
                  <p className="text-sm">{seller.speciality[locale]}</p>
                  <SellerFacts seller={seller} locale={locale} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function SellerProfile({ seller, locale }: { seller: Seller; locale: Locale }) {
  const t = marketplaceMessages[locale]
  return (
    <section className="border-b border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr] md:py-14">
        <div className="flex flex-col gap-4">
          <Link href={localePath(locale, "/marketplace")} className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            {t.item.back}
          </Link>
          <h1 className="font-heading text-4xl sm:text-5xl">{seller.name[locale]}</h1>
          <p className="text-muted-foreground">
            {seller.town[locale]}, {t.seller.since(seller.since).toLowerCase()}. {seller.speciality[locale]}
          </p>
          <p className="max-w-[60ch] text-pretty">{seller.about[locale]}</p>
        </div>
        <div className="flex flex-col gap-4 self-end rounded-[var(--radius)] border border-border bg-card p-5">
          <SellerFacts seller={seller} locale={locale} />
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <TruckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.item.shipping(formatBaht(seller.shipping), seller.shipsIn[0], seller.shipsIn[1])}
          </p>
        </div>
      </div>
    </section>
  )
}

export function ItemDetail({ item, locale }: { item: Item; locale: Locale }) {
  const t = marketplaceMessages[locale]
  const seller = getSeller(item.seller)!
  const more = items.filter((other) => other.seller === item.seller && other.id !== item.id && !other.sold).slice(0, 4)
  return (
    <>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pt-6 pb-14 sm:px-6 md:grid-cols-[1.2fr_1fr] md:gap-12 md:pt-10">
        <div className="relative aspect-square overflow-clip rounded-[var(--radius)] bg-plinth md:sticky md:top-24 md:self-start">
          <ListingPhoto item={item} alt={t.item.photo(item.name[locale])} priority sizes="(min-width: 768px) 55vw, 100vw" padding="p-6 md:p-10" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Link
              href={localePath(locale, `/marketplace/dealers/${seller.id}`)}
              className="w-fit rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t.card.by(seller.name[locale], seller.town[locale])}
            </Link>
            <h1 className={locale === "th" ? "font-heading text-3xl leading-[1.4] text-balance sm:text-4xl" : "font-heading text-3xl leading-tight text-balance sm:text-4xl"}>
              <Phrased text={item.name[locale]} />
            </h1>
            <BuyBox item={item} />
          </div>
          <p className="max-w-[60ch] text-pretty">{item.description[locale]}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
            {(
              [
                [t.item.era, item.era[locale]],
                [t.item.size, item.size[locale]],
                [t.item.condition, item.condition[locale]],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <TruckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t.item.shipping(formatBaht(seller.shipping), seller.shipsIn[0], seller.shipsIn[1])}
            </p>
            <p>{t.item.export}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t.item.soldBy}</p>
            <p className="font-heading text-xl">{seller.name[locale]}</p>
            <SellerFacts seller={seller} locale={locale} />
            <Button asChild variant="outline" className="self-start">
              <Link href={localePath(locale, `/marketplace/dealers/${seller.id}`)}>{t.seller.visit}</Link>
            </Button>
          </div>
        </div>
      </div>
      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6">
            <h2 id="more-heading" className="font-heading text-2xl">
              {t.item.moreFrom(seller.name[locale])}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {more.map((other) => (
                <ItemCard key={other.id} item={other} locale={locale} showSeller={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export function MarketplaceFooter({ locale }: { locale: Locale }) {
  const t = marketplaceMessages[locale]
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="max-w-[70ch]">{t.footer.note}</p>
        <p>
          © 2026 Talad. {t.footer.rights}
        </p>
      </div>
    </footer>
  )
}
