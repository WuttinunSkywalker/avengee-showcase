"use client"

import { useMemo } from "react"
import { CalendarSearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { spa } from "../../data/spa"
import { getTherapist } from "../../data/therapists"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { candidateTherapists, getSlots, timeOfDay, type Slot, type TimeOfDay } from "../../lib/availability"
import {
  addDays,
  dateRange,
  formatLongDate,
  formatMinutes,
  formatMonthShort,
  formatWeekday,
  type ISODate,
  type ZonedNow,
} from "../../lib/time"
import type { Booking } from "../../lib/types"
import { useBookingDraft } from "../../store/booking-draft-store"
import { TherapistAvatar } from "../shared"

const DAYS_SHOWN = 14
const periods: TimeOfDay[] = ["morning", "afternoon", "evening"]

export function TimeStep({ bookings, now, duration }: { bookings: readonly Booking[]; now: ZonedNow; duration: number }) {
  const { locale, t } = useSpaI18n()
  const { serviceId, therapist, date, start, setTherapist, setDate, setStart } = useBookingDraft()
  const qualified = serviceId ? candidateTherapists(serviceId, "any") : []
  const preferred = therapist !== "any" ? getTherapist(therapist) : undefined

  const days = useMemo(() => {
    if (!serviceId) return []
    return dateRange(now.date, Math.min(DAYS_SHOWN, spa.bookingWindowDays + 1)).map((day) => ({
      date: day,
      slots: getSlots({ date: day, serviceId, duration, therapist, bookings, now }),
    }))
  }, [serviceId, duration, therapist, bookings, now])

  const firstOpenDay = days.find((day) => day.slots.some((slot) => slot.therapistIds.length > 0))?.date
  const activeDate: ISODate | undefined = date && days.some((day) => day.date === date) ? date : firstOpenDay
  const activeDay = days.find((day) => day.date === activeDate)
  const openSlots = activeDay?.slots.filter((slot) => slot.therapistIds.length > 0) ?? []
  const nextOpenAfter = activeDate
    ? days.find((day) => day.date > activeDate && day.slots.some((slot) => slot.therapistIds.length > 0))?.date
    : undefined

  return (
    <div className="flex flex-col gap-10">
      <FieldSet>
        <FieldLegend className="font-heading text-2xl font-normal">{t.time.therapist}</FieldLegend>
        <FieldDescription>{t.time.therapistHint}</FieldDescription>
        <ToggleGroup
          type="single"
          variant="outline"
          value={therapist}
          onValueChange={(value) => value && setTherapist(value)}
          aria-label={t.time.therapist}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="any" className="h-11 px-4">
            {t.time.any}
          </ToggleGroupItem>
          {qualified.map((candidate) => (
            <ToggleGroupItem key={candidate.id} value={candidate.id} className="h-11 gap-2 pr-4 pl-1.5">
              <TherapistAvatar therapist={candidate} size="sm" locale={locale} />
              {t.team.call(candidate.name[locale])}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-2xl font-normal">{t.time.date}</FieldLegend>
        <ScrollArea className="-mx-1 w-[calc(100%+0.5rem)]">
          <ToggleGroup
            type="single"
            value={activeDate ?? ""}
            onValueChange={(value) => value && setDate(value)}
            aria-label={t.time.date}
            className="gap-2 px-1 pb-3"
          >
            {days.map((day) => {
              const available = day.slots.filter((slot) => slot.therapistIds.length > 0).length
              const label =
                day.date === now.date ? t.time.today : day.date === addDays(now.date, 1) ? t.time.tomorrow : formatWeekday(day.date, locale)
              const longDate = formatLongDate(day.date, locale)
              return (
                <ToggleGroupItem
                  key={day.date}
                  value={day.date}
                  disabled={available === 0}
                  aria-label={available === 0 ? t.time.dayFull(longDate) : t.time.dayFree(longDate, available)}
                  className="h-auto w-[4.5rem] flex-col gap-0.5 rounded-lg border border-border bg-card py-2.5 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <span className="text-xs">{label}</span>
                  <span className="font-heading text-lg leading-tight">{Number(day.date.slice(8))}</span>
                  <span className="text-[0.7rem] opacity-70">{available === 0 ? t.time.full : formatMonthShort(day.date, locale)}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-2xl font-normal">{t.time.time}</FieldLegend>
        {activeDate && <FieldDescription>{t.time.freeCount(formatLongDate(activeDate, locale), openSlots.length)}</FieldDescription>}
        {openSlots.length === 0 ? (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarSearchIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t.time.emptyTitle}</EmptyTitle>
              <EmptyDescription>{preferred ? t.time.emptyOne(preferred.name[locale]) : t.time.emptyAny}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center gap-2">
              {nextOpenAfter && <Button onClick={() => setDate(nextOpenAfter)}>{t.time.goTo(formatLongDate(nextOpenAfter, locale))}</Button>}
              {preferred && (
                <Button variant="outline" onClick={() => setTherapist("any")}>
                  {t.time.anyButton}
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6" aria-live="polite">
            {periods.map((period) => {
              const periodSlots = openSlots.filter((slot) => timeOfDay(slot.start) === period)
              if (periodSlots.length === 0) return null
              return (
                <SlotGroup
                  key={period}
                  label={t.time.periods[period]}
                  groupLabel={t.time.periodTimes(t.time.periods[period])}
                  slots={periodSlots}
                  selected={activeDate === date ? start : null}
                  onSelect={(slot) => {
                    if (activeDate && activeDate !== date) setDate(activeDate)
                    setStart(slot.start)
                  }}
                />
              )
            })}
          </div>
        )}
      </FieldSet>
    </div>
  )
}

function SlotGroup({
  label,
  groupLabel,
  slots,
  selected,
  onSelect,
}: {
  label: string
  groupLabel: string
  slots: Slot[]
  selected: number | null
  onSelect: (slot: Slot) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div role="radiogroup" aria-label={groupLabel} data-slot-group="" className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((slot) => {
          const isSelected = selected === slot.start
          return (
            <button
              key={slot.start}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(slot)}
              className={cn(
                "h-11 rounded-md border border-border bg-card text-sm font-medium tabular-nums transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSelected && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {formatMinutes(slot.start)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
