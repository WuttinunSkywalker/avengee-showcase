/** How far a showcase card has been dealt onto the table: 0 with its top at the bottom of the screen, 1 once its top is 55% up the screen. */
export function dealt(top: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport - top) / (viewport * 0.55)))
}
