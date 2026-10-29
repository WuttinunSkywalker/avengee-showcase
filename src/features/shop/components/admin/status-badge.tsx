import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import { shopMessages } from "../../i18n/messages"
import type { FulfilmentStatus } from "../../lib/admin"

const tones: Record<FulfilmentStatus, string> = {
  "awaiting-payment": "bg-roast-2/20 text-foreground ring-roast-2/50",
  "to-roast": "bg-primary/10 text-primary ring-primary/30",
  "ready-to-ship": "bg-roast-4/12 text-foreground ring-roast-4/40",
  shipped: "bg-leaf/12 text-leaf ring-leaf/40",
  delivered: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-muted text-muted-foreground line-through ring-border",
}

export function FulfilmentBadge({ status, locale }: { status: FulfilmentStatus; locale: Locale }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", tones[status])}>
      {shopMessages[locale].admin.status[status]}
    </span>
  )
}
