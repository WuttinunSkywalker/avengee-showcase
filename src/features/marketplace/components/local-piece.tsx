"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { useListingEdits, useLiveItems } from "../hooks/use-basket"
import { marketplaceMessages } from "../i18n/messages"
import { ItemDetail } from "./sections"

/** A piece listed from this browser's Seller Centre. It only exists here, so its page is drawn in the browser. */
export function LocalPiece() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const id = useSearchParams().get("id")
  const { ready } = useListingEdits()
  const item = useLiveItems().find((entry) => entry.id === id && entry.local)

  if (!ready) return <Skeleton className="mx-auto my-10 h-[32rem] w-full max-w-6xl" aria-busy="true" />
  if (!item) {
    return (
      <Empty className="mx-auto my-16 max-w-lg">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl font-normal">{t.order.pieceNotFoundTitle}</EmptyTitle>
          <EmptyDescription>{t.order.pieceNotFoundBody}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href={`${localePath(locale, "/marketplace")}#browse`}>{t.basket.browse}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  return <ItemDetail item={item} locale={locale} />
}
