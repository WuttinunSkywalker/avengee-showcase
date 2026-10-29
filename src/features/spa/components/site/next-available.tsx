"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { getSlots } from "../../lib/availability"
import { addDays, formatMinutes, formatShortDate } from "../../lib/time"
import { TherapistAvatar } from "../shared"

const SERVICE_ID = "thai-massage"
const MINUTES = 60

/** Live "next free slot" card, computed from the same availability engine as the booking flow. */
export function NextAvailable() {
  const data = useSpaData()
  const { locale, t, href } = useSpaI18n()

  const next = (() => {
    if (!data.ready) return null
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(data.now.date, offset)
      const slot = getSlots({
        date,
        serviceId: SERVICE_ID,
        duration: MINUTES,
        therapist: "any",
        bookings: data.bookings,
        now: data.now,
      }).find((candidate) => candidate.therapistIds.length > 0)
      if (slot) return { date, slot, isToday: offset === 0, isTomorrow: offset === 1 }
    }
    return null
  })()

  if (!data.ready) {
    return (
      <div className="flex flex-col gap-3 p-5" aria-busy="true" aria-label={t.next.loading}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  if (!next) {
    return (
      <div className="flex flex-col gap-2 p-5 text-sm">
        <p className="font-medium">{t.next.full}</p>
        <Link href={href("/spa/book")} className="text-celadon-deep underline underline-offset-4">
          {t.next.later}
        </Link>
      </div>
    )
  }

  const therapist = getTherapist(next.slot.therapistIds[0])!
  const service = getService(SERVICE_ID)!
  const dayLabel = next.isToday ? t.next.today : next.isTomorrow ? t.next.tomorrow : formatShortDate(next.date, locale)
  const bookHref = href(`/spa/book?service=${SERVICE_ID}&minutes=${MINUTES}&date=${next.date}&time=${next.slot.start}`)

  return (
    <div className="flex flex-col gap-3 p-5">
      <p className="text-xs text-muted-foreground">{t.next.nextFree(service.name[locale])}</p>
      <p className="font-heading text-3xl tabular-nums" data-testid="next-available-time">
        {dayLabel} {formatMinutes(next.slot.start)}
      </p>
      <p className="flex items-center gap-2 text-sm">
        <TherapistAvatar therapist={therapist} size="sm" locale={locale} />
        <span>
          {t.next.with(therapist.name[locale])}
          {next.slot.therapistIds.length > 1 && (
            <span className="text-muted-foreground">{t.next.more(next.slot.therapistIds.length - 1)}</span>
          )}
        </span>
      </p>
      <Button asChild className="w-full" size="lg">
        <Link href={bookHref}>{t.next.bookThis}</Link>
      </Button>
    </div>
  )
}
