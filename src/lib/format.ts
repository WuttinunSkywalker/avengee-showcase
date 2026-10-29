// Currency strings are assembled from plain number formatting: ICU builds
// disagree on the THB symbol, which would cause server/client mismatches.
const wholeFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const preciseFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("en-US")

/** 1200 → "฿1,200" */
export function formatBaht(amount: number): string {
  return `${amount < 0 ? "−" : ""}฿${wholeFormatter.format(Math.abs(amount))}`
}

/** 78.5 → "฿78.50" */
export function formatBahtPrecise(amount: number): string {
  return `${amount < 0 ? "−" : ""}฿${preciseFormatter.format(Math.abs(amount))}`
}

/** 184500 → "฿184.5K" */
export function formatBahtCompact(amount: number): string {
  return `฿${compactFormatter.format(amount)}`
}

/** 0.734 → "73%" */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** Signed percentage change, e.g. "+12%" or "−4%". Returns null when there is no baseline. */
export function formatChange(current: number, previous: number): string | null {
  if (previous === 0) return null
  const change = (current - previous) / previous
  const rounded = Math.round(change * 100)
  if (rounded === 0) return "0%"
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`
}

/** 870 → "14:30" (minutes since midnight to a 24-hour clock). */
export function formatMinutes(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`
}
