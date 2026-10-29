/** A day in a series drawn with the last, still-running day set apart. */
export type SplitDay<T> = T & {
  /** The value on finished days; null on the last day. */
  complete: number | null
  /** Only on the last two days, so a dashed segment joins yesterday to today. */
  partial: number | null
  /** The last day, still in progress. */
  today: boolean
}

/**
 * Today's total only counts the hours so far, so drawn like the other days
 * it always looks like a crash. This keeps finished days on one solid series
 * and draws yesterday→today as a separate, dashed one.
 */
export function splitPartialDay<T>(series: readonly T[], value: (day: T) => number): SplitDay<T>[] {
  const last = series.length - 1
  return series.map((day, i) => ({
    ...day,
    complete: i < last ? value(day) : null,
    partial: i >= last - 1 ? value(day) : null,
    today: i === last,
  }))
}

/**
 * Tooltip rows for a split series: yesterday shows only its solid value and
 * today only its dashed one, so no day appears twice.
 */
export function splitTooltipItems<P extends { dataKey?: unknown; payload?: { today?: boolean } }>(payload: readonly P[] | undefined): P[] {
  return (payload ?? []).filter((item) => {
    const today = !!item.payload?.today
    return item.dataKey === "partial" ? today : item.dataKey === "complete" && !today
  })
}
