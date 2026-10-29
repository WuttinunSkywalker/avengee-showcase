"use client"

import type { Locale } from "@/i18n/config"
import type { Product } from "../data/products"
import { useLiveProducts } from "../hooks/use-live-products"
import { ProductCard } from "./product-card"

/** A product card for server-rendered pages, updated with this device's live stock once it loads. */
export function LiveProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const live = useLiveProducts()
  return <ProductCard product={live.find((candidate) => candidate.id === product.id) ?? product} locale={locale} />
}
