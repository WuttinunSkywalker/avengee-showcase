"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { GiftIcon, PrinterIcon, SearchXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { usePersistHydrated } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import { normaliseVoucherCode } from "../../lib/vouchers"
import { useVouchersStore } from "../../store/vouchers-store"
import { VoucherCard } from "./voucher-card"

export function GiftSent() {
  const { t, href } = useSpaI18n()
  const s = t.gift.sent
  const code = normaliseVoucherCode(useSearchParams().get("code") ?? "")
  const hydrated = usePersistHydrated(useVouchersStore.persist)
  const voucher = useVouchersStore((state) => state.issued.find((issued) => issued.code === code))

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16" aria-busy="true">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="aspect-[7/4] w-full rounded-xl" />
      </div>
    )
  }

  if (!voucher) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{s.notFoundTitle}</EmptyTitle>
            <EmptyDescription>{s.notFound}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={href("/spa/gift")}>{t.nav.gift}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const toThem = voucher.delivery === "them"
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl leading-tight text-balance sm:text-5xl">{toThem ? s.titleThem(voucher.to) : s.titleMe}</h1>
        <p className="text-muted-foreground">{toThem ? s.bodyThem(voucher.recipientEmail, voucher.buyerEmail) : s.bodyMe(voucher.buyerEmail)}</p>
      </div>

      <VoucherCard {...voucher} />

      <div className="flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <GiftIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          {s.paid(formatBaht(voucher.amount))}
        </p>
        <p className="text-muted-foreground">{s.howTo}</p>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button size="lg" onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" aria-hidden="true" />
          {s.print}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={href("/spa/book")}>{s.book}</Link>
        </Button>
        <Button size="lg" variant="ghost" asChild>
          <Link href={href("/spa/gift")}>{s.another}</Link>
        </Button>
      </div>
    </div>
  )
}
