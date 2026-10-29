import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Five-star rating. `label` is read out instead of the icons, e.g. "4.8 out of 5 stars". */
export function Stars({ rating, label, className }: { rating: number; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          className={cn("size-3.5", i < Math.round(rating) ? "fill-turmeric text-turmeric" : "text-border")}
        />
      ))}
    </span>
  )
}
