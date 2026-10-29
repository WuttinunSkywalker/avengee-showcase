import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import type { RoastLevel } from "../data/products"
import { shopMessages } from "../i18n/messages"

const roastColours = ["bg-roast-1", "bg-roast-2", "bg-roast-3", "bg-roast-4", "bg-roast-5"]

/** Five steps from green bean to dark; steps up to the roast level take that roast's colour. */
export function RoastMeter({ level, locale, compact = false, className }: { level: RoastLevel; locale: Locale; compact?: boolean; className?: string }) {
  const t = shopMessages[locale].product
  const label = t.roastLevels[level]
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className={cn("flex", compact ? "gap-[1cqw]" : "gap-1")} aria-hidden="true">
        {roastColours.map((colour, index) => (
          <span
            key={colour}
            className={cn(
              "rounded-full",
              compact ? "h-[1.6cqw] w-[6cqw]" : "h-1.5 w-5",
              index < level ? roastColours[level - 1] : "bg-black/10 dark:bg-white/15",
            )}
          />
        ))}
      </span>
      <span className={cn(compact ? "" : "text-xs text-muted-foreground")}>
        <span className="sr-only">{t.roast}: </span>
        {label}
      </span>
    </span>
  )
}
