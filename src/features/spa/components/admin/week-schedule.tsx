"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { Locale } from "@/i18n/config"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getService } from "../../data/services"
import { spa } from "../../data/spa"
import { getTherapist, therapists } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { parseWeek, reassignOptions, therapistWeek, weekLoad } from "../../lib/schedule"
import { addDays, formatDuration, formatLongDate, formatMinutes, formatShortDate, formatTimeRange, type ZonedNow } from "../../lib/time"
import type { Booking } from "../../lib/types"
import { useBookingsStore } from "../../store/bookings-store"
import { TherapistAvatar } from "../shared"

const OPEN = spa.hours.open
const SPAN = spa.hours.close - spa.hours.open
const HOUR_PX = 52
const hours = Array.from({ length: SPAN / 60 }, (_, i) => OPEN + i * 60)

const blockClasses: Record<Booking["status"], string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending: "bg-turmeric/25 text-foreground ring-1 ring-inset ring-turmeric",
  completed: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  "no-show": "bg-teak/15 text-teak ring-1 ring-inset ring-teak/40 line-through",
  cancelled: "hidden",
}

const hatch = "bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)]"

/**
 * One therapist's week, Monday to Sunday, bookings drawn to scale across
 * opening hours. Any booking can be handed to someone else who's free. The
 * week and therapist live in the URL.
 */
export function WeekSchedule() {
  const { locale, t } = useSpaI18n()
  const w = t.admin.week
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const data = useSpaData()
  useStorageSync(useBookingsStore.persist)
  const therapist = getTherapist(params.get("therapist") ?? "") ?? therapists[0]
  const [open, setOpen] = useState<Booking | null>(null)

  const go = (next: { week?: string; therapist?: string }) => {
    const query = new URLSearchParams(params.toString())
    if (next.week) query.set("week", next.week)
    if (next.therapist) query.set("therapist", next.therapist)
    router.replace(`${pathname}?${query}`, { scroll: false })
  }

  if (!data.ready) return <Skeleton className="m-4 h-[40rem] sm:m-6" aria-busy="true" />

  const monday = parseWeek(params.get("week"), data.now.date)
  const days = therapistWeek(therapist, monday, data.bookings)
  const load = weekLoad(therapist, days)
  const today = data.now.date

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">{w.title}</h1>
        <p className="text-muted-foreground">{w.range(formatLongDate(monday, locale), formatLongDate(addDays(monday, 6), locale))}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={therapist.id} onValueChange={(id) => go({ therapist: id })}>
          <SelectTrigger className="w-56" aria-label={w.therapist}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {therapists.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.name[locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label={w.previous} onClick={() => go({ week: addDays(monday, -7) })}>
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button variant="outline" onClick={() => go({ week: today })} disabled={parseWeek(today, today) === monday}>
            {w.thisWeek}
          </Button>
          <Button variant="outline" size="icon" aria-label={w.next} onClick={() => go({ week: addDays(monday, 7) })}>
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <TherapistAvatar therapist={therapist} locale={locale} />
          <div className="flex flex-col gap-0.5">
            <CardTitle>{therapist.name[locale]}</CardTitle>
            <CardDescription data-testid="week-load">{w.load(load.bookings, formatDuration(load.bookedMinutes, locale), formatPercent(load.share))}</CardDescription>
            <CardDescription>{w.shift(formatMinutes(therapist.shift.start), formatMinutes(therapist.shift.end))}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop: the week as a grid, to scale */}
          <div className="hidden md:block" role="table" aria-label={w.gridAria(therapist.name[locale])}>
            <div role="row" className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 pb-2 text-sm">
              <span role="columnheader" />
              {days.map((day) => (
                <span key={day.date} role="columnheader" className={cn("rounded-md px-2 py-1 text-center", day.date === today && "bg-primary/10 font-medium text-primary")}>
                  {formatShortDate(day.date, locale)}
                </span>
              ))}
            </div>
            <div role="row" className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1">
              <div role="cell" className="relative" style={{ height: (SPAN / 60) * HOUR_PX }}>
                {hours.map((hour) => (
                  <span key={hour} className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums" style={{ top: ((hour - OPEN) / 60) * HOUR_PX }}>
                    {formatMinutes(hour)}
                  </span>
                ))}
              </div>
              {days.map((day) => (
                <div
                  key={day.date}
                  role="cell"
                  className={cn("relative overflow-hidden rounded-md border border-border", day.working ? "bg-muted/30" : hatch)}
                  style={{ height: (SPAN / 60) * HOUR_PX }}
                  data-testid="week-day"
                >
                  {hours.slice(1).map((hour) => (
                    <span key={hour} aria-hidden="true" className="absolute inset-x-0 border-t border-border/60" style={{ top: ((hour - OPEN) / 60) * HOUR_PX }} />
                  ))}
                  {day.working ? (
                    <>
                      {/* Off-shift hours are hatched so gaps read as "not working", not "free" */}
                      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0", hatch)} style={{ height: ((therapist.shift.start - OPEN) / 60) * HOUR_PX }} />
                      <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0", hatch)} style={{ height: ((spa.hours.close - therapist.shift.end) / 60) * HOUR_PX }} />
                      {day.bookings.length === 0 && <span className="sr-only">{w.free}</span>}
                      {day.bookings.map((booking) => (
                        <BookingBlock key={booking.id} booking={booking} locale={locale} onOpen={() => setOpen(booking)} />
                      ))}
                    </>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      <span className="rounded-md bg-background px-2 py-1">{w.dayOff}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phones: the same week as a list, day by day */}
          <ol className="flex flex-col divide-y divide-border md:hidden" aria-label={w.gridAria(therapist.name[locale])}>
            {days.map((day) => (
              <li key={day.date} className="flex flex-col gap-2 py-3" data-testid="week-day-list">
                <p className={cn("text-sm font-medium", day.date === today && "text-primary")}>{formatLongDate(day.date, locale)}</p>
                {!day.working ? (
                  <p className="text-sm text-muted-foreground">{w.dayOff}</p>
                ) : day.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{w.free}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {day.bookings.map((booking) => (
                      <li key={booking.id}>
                        <button
                          type="button"
                          onClick={() => setOpen(booking)}
                          className={cn("flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", blockClasses[booking.status])}
                          aria-label={w.open(formatTimeRange(booking.start, booking.duration), getService(booking.serviceId)?.name[locale] ?? "", booking.guest.name)}
                        >
                          <span className="truncate font-medium">{booking.guest.name}</span>
                          <span className="shrink-0 tabular-nums">{formatTimeRange(booking.start, booking.duration)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <ReassignDialog booking={open} bookings={data.bookings} now={data.now} locale={locale} onClose={() => setOpen(null)} />
    </div>
  )
}

function BookingBlock({ booking, locale, onOpen }: { booking: Booking; locale: Locale; onOpen: () => void }) {
  const { t } = useSpaI18n()
  const service = getService(booking.serviceId)
  const top = ((booking.start - OPEN) / 60) * HOUR_PX
  const height = (booking.duration / 60) * HOUR_PX
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute inset-x-1 flex flex-col overflow-hidden rounded-sm px-1.5 py-1 text-left text-[0.72rem] leading-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        blockClasses[booking.status],
      )}
      style={{ top: top + 1, height: height - 2 }}
      aria-label={t.admin.week.open(formatTimeRange(booking.start, booking.duration), service?.name[locale] ?? "", booking.guest.name)}
      data-testid="week-booking"
    >
      <span className="truncate font-medium">{booking.guest.name.split(" ")[0]}</span>
      <span className="truncate tabular-nums">{formatMinutes(booking.start)}</span>
      {height > 56 && <span className="truncate">{service?.name[locale]}</span>}
    </button>
  )
}

/** Still to come and not settled: the only bookings that can change hands. */
function isUpcoming(booking: Booking, now: ZonedNow): boolean {
  const active = booking.status === "confirmed" || booking.status === "pending"
  return active && (booking.date > now.date || (booking.date === now.date && booking.start > now.minutes))
}

function ReassignDialog({ booking, bookings, now, locale, onClose }: { booking: Booking | null; bookings: readonly Booking[]; now: ZonedNow; locale: Locale; onClose: () => void }) {
  const { t } = useSpaI18n()
  const r = t.admin.week.reassign
  const move = useBookingsStore((state) => state.move)
  const [choice, setChoice] = useState("")
  const upcoming = booking ? isUpcoming(booking, now) : false
  const options = booking && upcoming ? reassignOptions(booking, bookings) : []
  const current = booking ? getTherapist(booking.therapistId) : undefined
  const service = booking ? getService(booking.serviceId) : undefined
  const available = options.filter((option) => !option.reason)

  return (
    <Dialog
      open={booking !== null}
      onOpenChange={(next) => {
        if (!next) {
          setChoice("")
          onClose()
        }
      }}
    >
      {booking && (
        <DialogContent className="sm:max-w-md" data-testid="reassign-dialog">
          <DialogHeader>
            <DialogTitle>{r.title}</DialogTitle>
            <DialogDescription>
              {booking.guest.name}, {service?.name[locale]} {formatDuration(booking.serviceMinutes, locale)}. {formatShortDate(booking.date, locale)} {formatTimeRange(booking.start, booking.duration)}. {current && r.current(current.name[locale])}
            </DialogDescription>
          </DialogHeader>
          {!upcoming ? (
            <p className="text-sm text-muted-foreground">{r.past}</p>
          ) : (
            <FieldSet>
              <FieldLegend variant="label">{r.pick}</FieldLegend>
              <RadioGroup value={choice} onValueChange={setChoice}>
                {options.map(({ therapist, reason, clash }) => (
                  <Field key={therapist.id} orientation="horizontal" data-disabled={Boolean(reason)}>
                    <RadioGroupItem value={therapist.id} id={`reassign-${therapist.id}`} disabled={Boolean(reason)} />
                    <FieldContent>
                      <FieldLabel htmlFor={`reassign-${therapist.id}`} className="font-normal">
                        {therapist.name[locale]}
                      </FieldLabel>
                      {reason && <FieldDescription>{reason === "busy" ? r.reasons.busy(clash ? formatTimeRange(clash.start, clash.duration) : "") : r.reasons[reason]}</FieldDescription>}
                    </FieldContent>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          )}
          {upcoming && available.length === 0 && <p className="text-sm text-muted-foreground">{r.none}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {r.cancel}
            </Button>
            <Button
              disabled={!choice || !upcoming}
              onClick={() => {
                const next = getTherapist(choice)
                move(booking.id, { date: booking.date, start: booking.start, therapistId: choice })
                toast.success(r.done(next?.name[locale] ?? ""))
                setChoice("")
                onClose()
              }}
            >
              {r.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
