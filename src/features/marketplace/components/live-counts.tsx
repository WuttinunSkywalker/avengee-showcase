"use client"

import type { Locale } from "@/i18n/config"
import { useLiveItems } from "../hooks/use-basket"
import { marketplaceMessages } from "../i18n/messages"
import { sellerStock } from "../lib/search"

/*
 * Counts that follow what dealers have listed, taken down or sold from this
 * browser. Until storage is read they show the catalogue's own numbers, the
 * same as the server rendered.
 */

export function LiveSellerStock({ sellerId, locale }: { sellerId: string; locale: Locale }) {
  const stock = sellerStock(sellerId, useLiveItems())
  return <>{marketplaceMessages[locale].seller.stock(stock.forSale, stock.sold)}</>
}

export function LivePiecesForSale({ locale }: { locale: Locale }) {
  const forSale = useLiveItems().filter((item) => !item.sold && !item.hidden).length
  return <>{marketplaceMessages[locale].hero.pieces(forSale)}</>
}
