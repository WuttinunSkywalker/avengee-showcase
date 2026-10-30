"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarClockIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { Locale } from "@/i18n/config"
import { getService } from "../../data/services"
import { spa } from "../../data/spa"
import { getTherapist } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { getSlots, worksOn } from "../../lib/availability"
import { formatBaht } from "../../lib/format"
import { findBooking, FREE_CHANGE_HOURS, managePolicy } from "../../lib/manage"
import { addDays, dateRange, formatDuration, formatLongDate, formatMinutes, formatShortDate, formatTimeRange, type ISODate, type ZonedNow } from "../../lib/time"
import type { Booking } from "../../lib/types"
import { useBookingsStore } from "../../store/bookings-store"
import { StatusBadge, TherapistAvatar } from "../shared"

/**
 * Guests find their booking with its reference and the email they used, then
 * move it or cancel it within the 24-hour policy. Reference and email live in
 * the URL, so the link in the confirmation email opens straight to it.
 */
export function ManageBooking() {
  const { locale, t } = useSpaI18n()
  const m = t.manage
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const data = useSpaData()
  useStorageSync(useBookingsStore.persist)
  const ref = params.get("ref") ?? ""
  const email = params.get("email") ?? ""
  const [form, setForm] = useState({ ref, email })
  const [missing, setMissing] = useState(false)
  const booking = data.ready && ref && email ? findBooking(data.bookings, ref, email) : undefined
  const searched = Boolean(ref && email)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl leading-tight sm:text-5xl">{m.title}</h1>
        <p className="max-w-[60ch] text-muted-foreground">{m.intro}</p>
      </div>

      <form
        noValidate
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (!form.ref.trim() || !form.email.trim()) {
            setMissing(true)
            return
          }
          setMissing(false)
          router.replace(`${pathname}?${new URLSearchParams({ ref: form.ref.trim(), email: form.email.trim() })}`, { scroll: false })
        }}
      >
        <FieldGroup className="sm:flex-row sm:items-end">
          <Field data-invalid={missing && !form.ref.trim()}>
            <FieldLabel htmlFor="manage-ref">{m.reference}</FieldLabel>
            <Input id="manage-ref" value={form.ref} onChange={(event) => setForm({ ...form, ref: event.target.value })} placeholder={m.referencePlaceholder} autoComplete="off" spellCheck={false} />
          </Field>
          <Field data-invalid={missing && !form.email.trim()}>
            <FieldLabel htmlFor="manage-email">{m.email}</FieldLabel>
            <Input id="manage-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Button type="submit" size="lg" className="sm:w-auto">
            {m.find}
          </Button>
        </FieldGroup>
        {missing && <FieldError className="mt-3">{m.missing}</FieldError>}
      </form>

      {searched && !data.ready && <Skeleton className="h-72 rounded-2xl" aria-busy="true" />}
      {searched && data.ready && !booking && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground" role="status" data-testid="manage-not-found">
          {m.notFound}
        </p>
      )}
      {booking && data.ready && <BookingPanel key={`${booking.id}-${booking.date}-${booking.start}`} booking={booking} bookings={data.bookings} now={data.now} locale={locale} />}
    </div>
  )
}

function BookingPanel({ booking, bookings, now, locale }: { booking: Booking; bookings: readonly Booking[]; now: ZonedNow; locale: Locale }) {
  const { t } = useSpaI18n()
  const m = t.manage
  const service = getService(booking.serviceId)
  const therapist = getTherapist(booking.therapistId)
  const policy = managePolicy(booking, now)
  const [changing, setChanging] = useState(false)
  const cancelByGuest = useBookingsStore((state) => state.cancelByGuest)
  // The free-change deadline: 24 hours before, so the same time the day before
  const deadlineDate = addDays(booking.date, -FREE_CHANGE_HOURS / 24)
  const deposit = booking.payment.amountPaid

  return (
    <section aria-labelledby="your-booking" className="flex flex-col gap-6" data-testid="manage-booking">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {m.yourBooking} <span className="font-medium text-foreground tabular-nums">{booking.reference}</span>
            </p>
            <h2 id="your-booking" className="font-heading text-2xl">
              {service?.name[locale]} {formatDuration(booking.serviceMinutes, locale)}
            </h2>
          </div>
          <StatusBadge status={booking.status} locale={locale} />
        </div>
        <div className="flex items-center gap-3">
          {therapist && <TherapistAvatar therapist={therapist} locale={locale} />}
          <div className="text-sm">
            <p className="font-medium" data-testid="manage-when">
              {formatLongDate(booking.date, locale)}, {formatTimeRange(booking.start, booking.duration)}
            </p>
            {therapist && <p className="text-muted-foreground">{m.with(therapist.name[locale])}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{deposit > 0 ? `${m.deposit} ${formatBaht(deposit)}` : m.noDeposit}</p>
      </div>

      <p className="flex items-start gap-3 text-sm" data-testid="manage-policy">
        <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {policy.settled
          ? m.settled
          : policy.free
            ? m.freeUntil(formatLongDate(deadlineDate, locale), formatMinutes(booking.start))
            : deposit > 0
              ? m.late(formatBaht(deposit), spa.phone)
              : m.lateNoDeposit(spa.phone)}
      </p>

      {!policy.settled && (
        <div className="flex flex-wrap gap-3">
          {policy.free ? (
            <Button size="lg" onClick={() => setChanging(true)} disabled={changing}>
              {m.change}
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <a href={spa.phoneHref}>
                <PhoneIcon data-icon="inline-start" aria-hidden="true" />
                {spa.phone}
              </a>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" variant="ghost">
                {m.cancel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{m.cancelTitle}</AlertDialogTitle>
                <AlertDialogDescription>{deposit === 0 ? m.cancelNothing : policy.free ? m.cancelRefund(formatBaht(deposit)) : m.cancelKeep(formatBaht(deposit))}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{m.back}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    cancelByGuest(booking.id, policy.free)
                    toast.success(m.cancelled, policy.refund > 0 ? { description: m.refunded(formatBaht(policy.refund)) } : undefined)
                  }}
                >
                  {m.confirmCancel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {changing && policy.free && <Reschedule booking={booking} bookings={bookings} now={now} locale={locale} onDone={() => setChanging(false)} />}
    </section>
  )
}

/** Days and times the same therapist is free for the same treatment, leaving out the booking being moved. */
function Reschedule({ booking, bookings, now, locale, onDone }: { booking: Booking; bookings: readonly Booking[]; now: ZonedNow; locale: Locale; onDone: () => void }) {
  const { t } = useSpaI18n()
  const m = t.manage
  const therapist = getTherapist(booking.therapistId)
  const move = useBookingsStore((state) => state.move)
  const others = bookings.filter((other) => other.id !== booking.id)
  // From tomorrow, no earlier than this time of day, so the new time is also more than 24 hours away
  const days = dateRange(addDays(now.date, 1), 14).filter((day) => !therapist || worksOn(therapist, day))
  const [day, setDay] = useState<ISODate>(days[0])
  const [start, setStart] = useState<string>("")
  const slots = getSlots({ date: day, serviceId: booking.serviceId, duration: booking.duration, therapist: booking.therapistId, bookings: others, now }).filter(
    (slot) => slot.therapistIds.length > 0 && (slot.start !== booking.start || day !== booking.date) && (day !== addDays(now.date, 1) || slot.start >= now.minutes),
  )

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border p-5 sm:p-6" data-testid="reschedule">
      <div className="flex flex-col gap-2">
        <p id="pick-day" className="text-sm font-medium">
          {m.pickDay}
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          value={day}
          onValueChange={(value) => {
            if (!value) return
            setDay(value as ISODate)
            setStart("")
          }}
          aria-labelledby="pick-day"
          className="flex-wrap justify-start"
        >
          {days.map((option) => (
            <ToggleGroupItem key={option} value={option} className="px-3">
              {formatShortDate(option, locale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <p id="pick-time" className="text-sm font-medium">
          {m.pickTime}
        </p>
        {slots.length ? (
          <ToggleGroup type="single" variant="outline" value={start} onValueChange={setStart} aria-labelledby="pick-time" className="flex-wrap justify-start">
            {slots.map((slot) => (
              <ToggleGroupItem key={slot.start} value={String(slot.start)} className="px-3 tabular-nums">
                {formatMinutes(slot.start)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <p className="text-sm text-muted-foreground">{m.noTimes(therapist?.name[locale] ?? "")}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!start}
          onClick={() => {
            move(booking.id, { date: day, start: Number(start), therapistId: booking.therapistId })
            toast.success(m.changed(formatLongDate(day, locale), formatMinutes(Number(start))))
            onDone()
          }}
        >
          {m.confirmChange}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {m.keep}
        </Button>
      </div>
    </div>
  )
}
