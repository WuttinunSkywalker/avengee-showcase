/**
 * The spa lives in Bangkok (UTC+7, no daylight saving). All scheduling math
 * uses plain calendar dates ("YYYY-MM-DD") and minutes since midnight in spa
 * local time, so visitors in any timezone see the same timetable.
 */

import type { DateLocale } from "@/lib/dates"
import { formatMinutes } from "@/lib/format"

export { formatDayMonth, formatLongDate, formatMonthShort, formatShortDate, formatWeekday, type DateLocale } from "@/lib/dates"

export const SPA_TIMEZONE = "Asia/Bangkok"

export type ISODate = string // "YYYY-MM-DD"

export interface ZonedNow {
  date: ISODate
  minutes: number
}

const zonedPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SPA_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** Converts an instant to the spa's local calendar date and minute of day. */
export function toSpaTime(instant: Date): ZonedNow {
  const parts = Object.fromEntries(
    zonedPartsFormatter.formatToParts(instant).map((part) => [part.type, part.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: string): value is ISODate {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function toUTCDate(date: ISODate): Date {
  if (!isISODate(date)) throw new Error(`Invalid ISO date: ${date}`)
  return new Date(`${date}T00:00:00Z`)
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = toUTCDate(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTCDate(to).getTime() - toUTCDate(from).getTime()) / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: ISODate): number {
  return toUTCDate(date).getUTCDay()
}

export function isWeekend(date: ISODate): boolean {
  const day = dayOfWeek(date)
  return day === 0 || day === 6
}

export function dateRange(start: ISODate, days: number): ISODate[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i))
}

/** Returns the UTC instant for a spa-local date and minute of day. */
export function spaTimeToInstant(date: ISODate, minutes: number): Date {
  const d = toUTCDate(date)
  return new Date(d.getTime() + (minutes - 7 * 60) * 60_000)
}

export { formatMinutes }

export function formatTimeRange(start: number, durationMinutes: number): string {
  return `${formatMinutes(start)}–${formatMinutes(start + durationMinutes)}`
}

/** "60 min", "1 hr 30 min", "2 hr" / "45 นาที", "1 ชม. 30 นาที" */
export function formatDuration(minutes: number, locale: DateLocale = "en"): string {
  const [hr, min] = locale === "th" ? ["ชม.", "นาที"] : ["hr", "min"]
  if (minutes < 60) return `${minutes} ${min}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} ${hr}` : `${hours} ${hr} ${rest} ${min}`
}
