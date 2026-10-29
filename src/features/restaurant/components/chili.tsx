import { cn } from "@/lib/utils"

/** A bird's eye chilli, drawn small for heat ratings. */
export function Chili({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3.5", className)}>
      <path
        d="M11.6 2.2c.4-.6 1-.9 1.6-.8M12.4 3.9c1 .8 1.1 2.4.2 4.3-1.4 2.9-4.6 5.6-8.6 6.4-.9.2-1.3-.9-.6-1.4 2.6-1.8 4.6-4.1 5.6-6.5.7-1.7 2.1-3.1 3.4-2.8Z"
        fill={filled ? "var(--chili)" : "none"}
        stroke="var(--chili)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Heat as chillies: one to four, or nothing for not spicy. */
export function HeatRating({ level, label }: { level: number; label: string }) {
  if (level === 0) return null
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: level }, (_, i) => (
        <Chili key={i} />
      ))}
    </span>
  )
}
