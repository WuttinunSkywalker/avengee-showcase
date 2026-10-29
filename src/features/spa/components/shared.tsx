import { Stars as SharedStars } from "@/components/stars"
import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import { initials, type Therapist } from "../data/therapists"
import { spaMessages } from "../i18n/messages"
import type { BookingStatus } from "../lib/types"

const toneClasses: Record<Therapist["tone"], string> = {
  celadon: "bg-celadon/45 text-foreground",
  indigo: "bg-primary text-primary-foreground",
  teak: "bg-teak text-white dark:text-background",
  turmeric: "bg-turmeric/80 text-[#3a2a05]",
}

export function TherapistAvatar({
  therapist,
  size = "md",
  locale = "en",
  className,
}: {
  therapist: Pick<Therapist, "name" | "fullName" | "tone">
  size?: "sm" | "md" | "lg"
  locale?: Locale
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none",
        size === "sm" && "size-7 text-[0.7rem]",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-16 font-heading text-xl font-normal",
        toneClasses[therapist.tone],
        className,
      )}
    >
      {size === "lg" ? therapist.name[locale].slice(0, 1) : initials(therapist.fullName.en)}
    </span>
  )
}

export function Stars({ rating, locale = "en", className }: { rating: number; locale?: Locale; className?: string }) {
  return <SharedStars rating={rating} label={spaMessages[locale].team.stars(rating)} className={className} />
}

export function PressureMeter({
  level,
  locale = "en",
  className,
}: {
  level: 1 | 2 | 3 | 4 | 5
  locale?: Locale
  className?: string
}) {
  const t = spaMessages[locale].menu
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("h-1.5 w-3 rounded-full", i < level ? "bg-celadon-deep" : "bg-border")} />
        ))}
      </span>
      <span>
        <span className="sr-only">{t.pressureSr}</span>
        {t.pressureLabel(t.pressure[level])}
      </span>
    </span>
  )
}

const statusClasses: Record<BookingStatus, string> = {
  pending: "bg-turmeric/20 text-warning ring-turmeric/40",
  confirmed: "bg-celadon/35 text-foreground ring-celadon",
  completed: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/25",
  "no-show": "bg-teak/12 text-teak ring-teak/30",
}

export function StatusBadge({
  status,
  locale = "en",
  className,
}: {
  status: BookingStatus
  locale?: Locale
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        statusClasses[status],
        className,
      )}
    >
      {spaMessages[locale].status[status]}
    </span>
  )
}
