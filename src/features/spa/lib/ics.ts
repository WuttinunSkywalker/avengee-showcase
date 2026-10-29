import { spaTimeToInstant, type ISODate } from "./time"

export interface CalendarEvent {
  uid: string
  title: string
  description?: string
  location?: string
  date: ISODate
  start: number
  duration: number
  /** Instant the file is generated; injected for deterministic output. */
  stamp: Date
}

/** "20261104T030000Z" */
export function toICSDate(instant: Date): string {
  return instant.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/** Escapes text per RFC 5545 §3.3.11. */
export function escapeICSText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

/** Folds content lines longer than 75 octets (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ""
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74 // continuation lines start with a space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.join("\r\n ")
}

export function buildICS(event: CalendarEvent): string {
  const start = spaTimeToInstant(event.date, event.start)
  const end = spaTimeToInstant(event.date, event.start + event.duration)
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baan Lamai//Booking Demo//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toICSDate(event.stamp)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICSText(event.description)}` : null,
    event.location ? `LOCATION:${escapeICSText(event.location)}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null)

  return lines.map(foldLine).join("\r\n") + "\r\n"
}
