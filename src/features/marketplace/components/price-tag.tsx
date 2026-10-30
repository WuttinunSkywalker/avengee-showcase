import { formatBaht } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * The dealer's tag: a punched card tag, the way prices hang off pieces in an
 * antiques shop. Sold pieces get a cinnabar tag instead of a price.
 */
export function PriceTag({ price, sold, soldLabel, size = "md", className }: { price: number; sold?: boolean; soldLabel: string; size?: "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center font-heading tabular-nums [clip-path:polygon(0.75rem_0,100%_0,100%_100%,0.75rem_100%,0_50%)]",
        "before:absolute before:top-1/2 before:left-2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-background",
        size === "lg" ? "h-11 pr-4 pl-7 text-2xl" : "h-8 pr-3 pl-6 text-base",
        sold ? "bg-cinnabar text-cinnabar-foreground" : "bg-accent text-accent-foreground",
        className,
      )}
    >
      {sold ? soldLabel : formatBaht(price)}
    </span>
  )
}
