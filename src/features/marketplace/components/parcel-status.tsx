"use client"

import { CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Phrased } from "@/components/phrased"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/i18n/config"
import { formatLongDate } from "@/lib/dates"
import { formatBaht } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Seller } from "../data/sellers"
import { marketplaceMessages } from "../i18n/messages"
import type { DealerOrder, Purchase } from "../lib/basket"
import { bangkokDay, canConfirm, parcelProgress, STAGES } from "../lib/orders"
import { usePurchasesStore } from "../store/basket-store"

/** Where one dealer's parcel is, and the button that pays the dealer once it's arrived. */
export function ParcelStatus({ purchase, order, seller, now, locale }: { purchase: Purchase; order: DealerOrder; seller: Seller; now: Date; locale: Locale }) {
  const t = marketplaceMessages[locale].order
  const confirm = usePurchasesStore((state) => state.confirm)
  const progress = parcelProgress(order, purchase.placedAt, now)
  const current = STAGES.indexOf(progress.stage)
  const dealer = seller.name[locale]
  const date = (at: number) => formatLongDate(bangkokDay(at), locale)

  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-4 gap-1" aria-label={t.progressLabel(dealer)} data-testid="parcel-progress">
        {STAGES.map((stage, index) => {
          const done = index <= current
          return (
            <li key={stage} className="flex flex-col gap-1.5" aria-current={index === current ? "step" : undefined}>
              <span className={cn("flex h-1.5 rounded-full", done ? "bg-primary" : "bg-border")} aria-hidden="true" />
              <span className={cn("text-xs leading-tight", index === current ? "font-medium text-foreground" : "text-muted-foreground")}>
                {done && index < current && <CheckIcon className="mr-0.5 inline size-3" aria-hidden="true" />}
                {t.stages[stage]}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground" data-testid="parcel-note">
          {progress.stage === "received"
            ? progress.autoReleased
              ? t.autoReleased(dealer, date(progress.releasedAt))
              : t.released(dealer, date(progress.releasedAt))
            : progress.stage === "packing"
              ? t.shipsBy(formatLongDate(order.shipsBy, locale))
              : t.onItsWay(progress.tracking, date(progress.releasedAt))}
        </p>
        {canConfirm(progress) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm">{t.confirm}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-xl font-normal">
                  <Phrased text={t.confirmTitle(dealer)} />
                </AlertDialogTitle>
                <AlertDialogDescription>{t.confirmBody(formatBaht(order.total), dealer)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.notYet}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    confirm(purchase.reference, order.reference, now)
                    toast.success(t.confirmed(dealer))
                  }}
                >
                  {t.confirmAction}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
