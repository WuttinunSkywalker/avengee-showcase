import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { isLocale, localePath, locales } from "@/i18n/config"
import { ProductCard } from "@/features/shop/components/product-card"
import { ProductGallery } from "@/features/shop/components/product/product-gallery"
import { PurchasePanel } from "@/features/shop/components/product/purchase-panel"
import { RoastMeter } from "@/features/shop/components/roast-meter"
import { getProduct, products } from "@/features/shop/data/products"
import { pairsWellWith, reviewsFor } from "@/features/shop/data/reviews"
import { shopMessages } from "@/features/shop/i18n/messages"
import { Stars } from "@/components/stars"

export function generateStaticParams() {
  return locales.flatMap((lang) => products.map((product) => ({ lang, id: product.id })))
}

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/coffee/[id]">): Promise<Metadata> {
  const { lang, id } = await params
  const product = getProduct(id)
  if (!product || !isLocale(lang)) return {}
  return {
    title: product.name,
    description: `${product.notes[lang].join(", ")}. ${product.description[lang]}`,
    alternates: { languages: { en: `/en/shop/coffee/${id}`, th: `/th/shop/coffee/${id}` } },
  }
}

// Every product is pre-generated, so reading params up front is cheap, and it lets
// unknown ids return a real 404 before streaming starts. (dynamicParams isn't
// available with Cache Components.)
export const instant = false

export default async function ProductPage({ params }: PageProps<"/[lang]/shop/coffee/[id]">) {
  const { lang, id } = await params
  const product = getProduct(id)
  if (!isLocale(lang) || !product) notFound()
  const t = shopMessages[lang]
  const reviews = reviewsFor(product)
  const pairs = pairsWellWith(product, products)
  const details = [
    { label: t.detail.details.farm, value: product.origin.farm[lang] },
    { label: t.detail.details.producer, value: product.origin.producer[lang] },
    { label: t.detail.details.region, value: product.origin.region[lang] },
    { label: t.detail.details.altitude, value: t.product.altitude(...product.origin.altitude) },
    { label: t.detail.details.process, value: t.product.process[product.process] },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href={localePath(lang, "/shop")} className="hover:text-foreground" translate="no">
            Kaffa Roasters
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={localePath(lang, "/shop/coffee")} className="hover:text-foreground">
            {t.catalog.breadcrumb}
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery product={product} />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">{product.origin.region[lang]}</p>
              <h1 className="font-heading text-4xl leading-[1.02] font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">
                {product.name}
              </h1>
              <p className="text-lg">{product.notes[lang].join(", ")}</p>
              <a href="#reviews" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Stars rating={product.rating} label={t.detail.stars(product.rating)} />
                {t.detail.reviewsSummary(product.rating, product.reviewCount)}
              </a>
            </div>
            <PurchasePanel product={product} />
            <section aria-labelledby="about-title" className="flex flex-col gap-4 border-t border-border pt-6">
              <h2 id="about-title" className="font-heading text-xl font-bold [font-stretch:105%]">
                {t.detail.about}
              </h2>
              <p className="leading-relaxed text-muted-foreground">{product.description[lang]}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {details.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
                <div className="contents">
                  <dt className="text-muted-foreground">{t.detail.details.roast}</dt>
                  <dd>
                    <RoastMeter level={product.roast} locale={lang} />
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>

      <section id="reviews" aria-labelledby="reviews-title" className="flex scroll-mt-24 flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="reviews-title" className="font-heading text-3xl font-extrabold [font-stretch:110%]">
            {t.detail.reviews}
          </h2>
          <p className="text-sm text-muted-foreground">{t.detail.reviewsSummary(product.rating, product.reviewCount)}</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-3 border-t border-border pt-5">
              <Stars rating={review.rating} label={t.detail.stars(review.rating)} />
              <blockquote lang={review.lang} className="leading-relaxed">
                “{review.body}”
              </blockquote>
              <p className="text-sm text-muted-foreground" lang={review.lang}>
                {review.author}, {review.city}. {shopMessages[review.lang].detail.brewedWith(review.method)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pairs-title" className="flex flex-col gap-6">
        <h2 id="pairs-title" className="font-heading text-3xl font-extrabold [font-stretch:110%]">
          {t.detail.pairs}
        </h2>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
          {pairs.map((pair) => (
            <li key={pair.id}>
              <ProductCard product={pair} locale={lang} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
