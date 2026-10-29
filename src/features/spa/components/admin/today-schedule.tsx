"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getService } from "../../data/services"
import { spa } from "../../data/spa"
import { therapists } from "../../data/therapists"
import { worksOn } from "../../lib/availability"
import { formatMinutes, formatTimeRange, type ZonedNow } from "../../lib/time"
import type { Booking } from "../../lib/types"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { TherapistAvatar } from "../shared"

const OPEN = spa.hours.open
const SPAN = spa.hours.close - spa.hours.open
const hours = Array.from({ length: SPAN / 60 + 1 }, (_, i) => OPEN + i * 60)

const blockClasses: Record<Booking["status"], string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending: "bg-turmeric/25 text-foreground ring-1 ring-inset ring-turmeric",
  completed: "bg-muted text-muted-foreground",
  "no-show": "bg-teak/15 text-teak ring-1 ring-inset ring-teak/40 line-through",
  cancelled: "hidden",
}

const pct = (minutes: number) => `${((minutes - OPEN) / SPAN) * 100}%`

/** One row per therapist on shift today, bookings drawn to scale across opening hours. */
export function TodaySchedule({ bookings, now }: { bookings: readonly Booking[]; now: ZonedNow }) {
  const { locale, t, href } = useSpaI18n()
  const onShift = therapists.filter((therapist) => worksOn(therapist, now.date))
  const todays = bookings.filter((booking) => booking.date === now.date && booking.status !== "cancelled")
  const showNow = now.minutes >= OPEN && now.minutes <= spa.hours.close

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.schedule}</CardTitle>
        <CardDescription>{t.admin.scheduleHint(todays.length, onShift.length)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[760px] pb-3" role="table" aria-label={t.admin.scheduleAria}>
            <div role="row" className="grid grid-cols-[7rem_1fr] text-xs text-muted-foreground">
              <span role="columnheader">
                <span className="sr-only">{t.summary.therapist}</span>
              </span>
              <div role="columnheader" className="relative h-5">
                {hours.map((hour) => (
                  <span key={hour} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pct(hour) }}>
                    {formatMinutes(hour)}
                  </span>
                ))}
              </div>
            </div>
            {onShift.map((therapist) => {
              const rowBookings = todays.filter((booking) => booking.therapistId === therapist.id)
              return (
                <div key={therapist.id} role="row" className="grid grid-cols-[7rem_1fr] items-center border-t border-border py-2">
                  <div role="rowheader" className="flex items-center gap-2 text-sm">
                    <TherapistAvatar therapist={therapist} size="sm" locale={locale} />
                    {therapist.name[locale]}
                  </div>
                  <div role="cell" className="relative h-11 rounded-md bg-muted/40">
                    {/* Off-shift time is hatched so gaps read as "not working", not "free". */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 rounded-l-md bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)]"
                      style={{ width: pct(therapist.shift.start) }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 right-0 rounded-r-md bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)]"
                      style={{ left: pct(therapist.shift.end) }}
                    />
                    {rowBookings.length === 0 && <span className="sr-only">{t.admin.noBookings}</span>}
                    {rowBookings.map((booking) => {
                      const service = getService(booking.serviceId)
                      return (
                        <Tooltip key={booking.id}>
                          <TooltipTrigger asChild>
                            <Link
                              href={href(`/spa/admin/bookings?q=${booking.reference}`)}
                              className={cn(
                                "absolute inset-y-1 flex min-w-0 flex-col justify-center overflow-hidden rounded-sm px-1.5 text-[0.7rem] leading-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                blockClasses[booking.status],
                              )}
                              style={{ left: `calc(${pct(booking.start)} + 1px)`, width: `calc(${(booking.duration / SPAN) * 100}% - 2px)` }}
                            >
                              <span className="truncate font-medium">{booking.guest.name.split(" ")[0]}</span>
                              <span className="truncate opacity-80">{formatMinutes(booking.start)}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{booking.guest.name}</p>
                            <p>
                              {service?.name[locale]}, {formatTimeRange(booking.start, booking.duration)}
                            </p>
                            <p>{t.status[booking.status]}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                    {showNow && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-destructive"
                        style={{ left: pct(now.minutes) }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label={t.admin.legend}>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary" aria-hidden="true" /> {t.status.confirmed}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-turmeric/25 ring-1 ring-turmeric ring-inset" aria-hidden="true" /> {t.status.pending}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted ring-1 ring-border ring-inset" aria-hidden="true" /> {t.status.completed}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-teak/15 ring-1 ring-teak/40 ring-inset" aria-hidden="true" /> {t.status["no-show"]}
          </li>
          {showNow && (
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 rounded-full bg-destructive" aria-hidden="true" /> {t.admin.now(formatMinutes(now.minutes))}
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
