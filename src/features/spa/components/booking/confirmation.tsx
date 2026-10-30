"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, MotionConfig } from "motion/react"
import { CalendarPlusIcon, CheckIcon, SearchXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/i18n/config"
import { getAddOn, getService } from "../../data/services"
import { spa } from "../../data/spa"
import { getTherapist } from "../../data/therapists"
import { useHydrateBookings } from "../../hooks/use-spa-data"
import { spaMessages } from "../../i18n/messages"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import { buildICS } from "../../lib/ics"
import { formatDuration, formatLongDate, formatTimeRange } from "../../lib/time"
import type { Booking } from "../../lib/types"
import { useBookingDraft } from "../../store/booking-draft-store"
import { useBookingsStore } from "../../store/bookings-store"
import { TherapistAvatar } from "../shared"

function downloadICS(booking: Booking, locale: Locale) {
  const t = spaMessages[locale]
  const service = getService(booking.serviceId)
  const therapist = getTherapist(booking.therapistId)
  const ics = buildICS({
    uid: `${booking.id}@baanlamai.example`,
    title: t.confirmation.eventTitle(service?.name[locale] ?? "", spa.name[locale]),
    description: t.confirmation.eventDescription(booking.reference, therapist ? t.team.call(therapist.name[locale]) : ""),
    location: `${spa.address.line1[locale]}, ${spa.address.line2[locale]}, ${spa.address.city[locale]}`,
    date: booking.date,
    start: booking.start,
    duration: booking.duration,
    stamp: new Date(),
  })
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `baan-lamai-${booking.reference}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

/** Guests are greeted by first name ("Mia", "คุณสมใจ"). */
function greetingName(name: string) {
  return name.trim().split(/\s+/)[0]
}

export function Confirmation() {
  const { locale, t, href } = useSpaI18n()
  const reference = useSearchParams().get("ref")
  const hydrated = useHydrateBookings()
  const booking = useBookingsStore((state) => state.created.find((candidate) => candidate.reference === reference))

  // The booking is saved, so the in-progress draft can go.
  useEffect(() => {
    if (!booking) return
    const clear = () => useBookingDraft.getState().reset()
    if (useBookingDraft.persist.hasHydrated()) clear()
    else void useBookingDraft.persist.rehydrate()?.then(clear)
  }, [booking])

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.confirmation.notFound}</EmptyTitle>
            <EmptyDescription>{t.confirmation.notFoundHint}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={href("/spa/book")}>{t.nav.book}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const service = getService(booking.serviceId)!
  const therapist = getTherapist(booking.therapistId)!
  const balance = booking.total - booking.payment.amountPaid
  const [before, email, after] = t.confirmation.sent(booking.guest.email)

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
        <div className="flex flex-col gap-3">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="inline-flex size-12 items-center justify-center rounded-full bg-celadon text-primary"
            aria-hidden="true"
          >
            <CheckIcon className="size-6" />
          </motion.span>
          <h1 className="font-heading text-4xl sm:text-5xl">{t.confirmation.title(greetingName(booking.guest.name))}</h1>
          <p className="text-muted-foreground">
            {before}
            <span className="font-medium break-all text-foreground">{email}</span>
            {after}
          </p>
        </div>

        <motion.section
          aria-label={t.confirmation.details}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-border bg-secondary px-5 py-4">
            <div>
              <p className="text-xs text-muted-foreground">{t.confirmation.reference}</p>
              <p className="font-heading text-2xl tracking-wide" data-testid="booking-reference">
                {booking.reference}
              </p>
            </div>
            <TherapistAvatar therapist={therapist} locale={locale} />
          </div>
          <dl className="grid gap-4 px-5 py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t.confirmation.treatment}</dt>
              <dd className="font-medium">
                {service.name[locale]}, {formatDuration(booking.serviceMinutes, locale)}
              </dd>
              {booking.addOnIds.length > 0 && (
                <dd className="text-muted-foreground">
                  {t.confirmation.plus(booking.addOnIds.map((id) => getAddOn(id)?.name[locale] ?? ""))}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-muted-foreground">{t.confirmation.therapist}</dt>
              <dd className="font-medium">{t.team.call(therapist.name[locale])}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.confirmation.date}</dt>
              <dd className="font-medium">{formatLongDate(booking.date, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.confirmation.time}</dt>
              <dd className="font-medium tabular-nums">{formatTimeRange(booking.start, booking.duration)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.confirmation.paid}</dt>
              <dd className="font-medium tabular-nums">
                {booking.payment.amountPaid > 0
                  ? t.confirmation.paidBy(formatBaht(booking.payment.amountPaid), t.method[booking.payment.method])
                  : t.confirmation.nothing}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.confirmation.due}</dt>
              <dd className="font-medium tabular-nums">{formatBaht(balance)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t.confirmation.where}</dt>
              <dd>
                {spa.address.line1[locale]} {spa.address.line2[locale]}. {spa.address.transit[locale]}
              </dd>
            </div>
          </dl>
        </motion.section>

        <div className="flex flex-wrap gap-3">
          <Button size="xl" onClick={() => downloadICS(booking, locale)}>
            <CalendarPlusIcon data-icon="inline-start" aria-hidden="true" />
            {t.confirmation.calendar}
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href={href("/spa")}>{t.confirmation.home}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.confirmation.another}{" "}
          <Link href={href("/spa/book")} className="font-medium text-foreground underline underline-offset-4">
            {t.confirmation.anotherLink}
          </Link>
        </p>
        <p className="text-sm">
          <Link
            href={`${href("/spa/book/manage")}?${new URLSearchParams({ ref: booking.reference, email: booking.guest.email })}`}
            className="font-medium underline underline-offset-4"
            data-testid="manage-link"
          >
            {t.manage.manageLink}
          </Link>
        </p>
      </div>
    </MotionConfig>
  )
}
