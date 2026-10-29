import Link from "next/link"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { localePath, type Locale } from "@/i18n/config"
import { restaurant } from "../data/menu"
import { restaurantMessages } from "../i18n/messages"

/** Krua Yai's sign: the Thai name large, the English small beneath, as on the shopfront. */
export function RestaurantHeader({ locale, table }: { locale: Locale; table?: number | null }) {
  const t = restaurantMessages[locale]
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href={localePath(locale, "/restaurant")} className="flex flex-col leading-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span className="font-heading text-2xl font-semibold text-primary" lang="th">
            {restaurant.nameTh}
          </span>
          <span className="text-xs tracking-wide text-muted-foreground" translate="no">
            {restaurant.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {table && (
            <span className="rounded-full bg-accent px-3 py-1 font-heading text-sm font-medium text-accent-foreground" data-testid="table-chip">
              {t.table.label(table)}
            </span>
          )}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}
