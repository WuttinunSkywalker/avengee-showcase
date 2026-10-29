import {
  BedDoubleIcon,
  Building2Icon,
  CalendarHeartIcon,
  CoffeeIcon,
  DumbbellIcon,
  Flower2Icon,
  GraduationCapIcon,
  PencilRulerIcon,
  ScissorsIcon,
  ShoppingBagIcon,
  StethoscopeIcon,
  UtensilsCrossedIcon,
  type LucideIcon,
} from "lucide-react"
import type { Locale } from "@/i18n/config"
import { portalMessages } from "./messages"

const icons: LucideIcon[] = [
  Flower2Icon,
  CoffeeIcon,
  UtensilsCrossedIcon,
  StethoscopeIcon,
  PencilRulerIcon,
  BedDoubleIcon,
  ShoppingBagIcon,
  GraduationCapIcon,
  DumbbellIcon,
  ScissorsIcon,
  Building2Icon,
  CalendarHeartIcon,
]

/**
 * The kinds of business we build for, drifting slowly across the page. The
 * list is written twice so the loop is seamless; the copy is hidden from
 * screen readers. Pauses on hover; reduced motion shows it as a still,
 * wrapped list.
 */
export function BusinessMarquee({ locale }: { locale: Locale }) {
  const t = portalMessages[locale].marquee
  const items = t.items.map((label, i) => ({ label, Icon: icons[i % icons.length] }))
  const list = (hidden: boolean) => (
    <ul className="marquee-list flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map(({ label, Icon }) => (
        <li key={label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm whitespace-nowrap">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-labelledby="marquee-title" className="marquee border-y border-border py-6" data-testid="business-marquee">
      <h2 id="marquee-title" className="sr-only">
        {t.title}
      </h2>
      <div className="marquee-track flex w-max">
        {list(false)}
        {list(true)}
      </div>
    </section>
  )
}
