"use client"

import Image from "next/image"
import { useEffect, useId, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BellRingIcon, ChefHatIcon, CheckIcon, LeafIcon, MinusIcon, PlusIcon, QrCodeIcon, ShoppingBasketIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatBaht } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ADD_ONS, CATEGORIES, dishes, getDish, restaurant, SPICE_LEVELS, type AddOnId, type Dish, type SpiceLevel } from "../data/menu"
import { restaurantMessages } from "../i18n/messages"
import {
  basketSummary,
  CALL_REASONS,
  canCall,
  lineKey,
  lineStatus,
  lineTotal,
  MAX_QUANTITY,
  NOTE_MAX,
  parseTable,
  roundProgress,
  roundsTotal,
  unitPrice,
  type BasketLine,
  type DishStatus,
  type Round,
} from "../lib/order"
import { deviceTicketId } from "../lib/kitchen"
import { useBasketStore } from "../store/basket-store"
import { useKitchenStore } from "../store/kitchen-store"
import { BillSheet } from "./bill-sheet"
import { Chili, HeatRating } from "./chili"
import { RestaurantHeader } from "./restaurant-header"

/** The QR code on each table opens ?table=N. Without one, guests land on the welcome screen. */
export function RestaurantApp() {
  const locale = useLocale()
  const table = parseTable(useSearchParams().get("table"))
  return (
    <>
      <RestaurantHeader locale={locale} table={table} />
      <main id="main" className="flex flex-1 flex-col">
        {table ? <TableMenu table={table} locale={locale} /> : <TableLanding locale={locale} />}
      </main>
    </>
  )
}

function TableLanding({ locale }: { locale: Locale }) {
  const t = restaurantMessages[locale]
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:items-center md:py-16">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] md:order-2">
        <Image src="/images/restaurant/khao-soi.webp" alt="" fill priority sizes="(min-width: 768px) 460px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col gap-6">
        <p className="text-sm font-medium text-primary">{t.tagline}</p>
        <h1 className="font-heading text-4xl leading-tight font-semibold sm:text-5xl">{t.landing.title}</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{t.landing.body}</p>
        <div className="flex items-center gap-3 rounded-[var(--radius)] bg-accent p-4">
          <QrCodeIcon className="size-8 shrink-0 text-accent-foreground" aria-hidden="true" />
          <p className="font-heading font-medium">{t.landing.scan}</p>
        </div>
        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const table = parseTable(value.trim())
            if (!table) return setError(true)
            router.push(`${pathname}?table=${table}`)
          }}
        >
          <p className="text-sm text-muted-foreground">{t.landing.or}</p>
          <Field data-invalid={error || undefined} className="max-w-xs">
            <FieldLabel htmlFor="table-number">{t.landing.table}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="table-number"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                value={value}
                placeholder={t.landing.tablePlaceholder}
                aria-invalid={error}
                onChange={(event) => {
                  setValue(event.target.value.replace(/\D/g, ""))
                  setError(false)
                }}
                className="h-11 w-24 tabular-nums"
              />
              <Button type="submit" size="xl">
                {t.landing.open}
              </Button>
            </div>
            {error && <FieldError>{t.landing.tableError}</FieldError>}
          </Field>
        </form>
        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
          <div>
            <dt className="text-muted-foreground">{t.landing.hours}</dt>
            <dd className="font-medium tabular-nums">{restaurant.hours}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.landing.visit}</dt>
            {restaurant.address[locale].map((line) => (
              <dd key={line}>{line}</dd>
            ))}
          </div>
        </dl>
      </div>
    </div>
  )
}

function TableMenu({ table, locale }: { table: number; locale: Locale }) {
  const t = restaurantMessages[locale]
  const hydrated = usePersistHydrated(useBasketStore.persist)
  const setTable = useBasketStore((state) => state.setTable)
  const lines = useBasketStore((state) => state.lines)
  const rounds = useBasketStore((state) => state.rounds)
  const basketOpen = useBasketStore((state) => state.open)
  const setBasketOpen = useBasketStore((state) => state.setOpen)
  const [open, setOpen] = useState<Dish | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const now = useNow()
  const kitchenHydrated = usePersistHydrated(useKitchenStore.persist)
  // A table and the kitchen open in two tabs keep each other up to date
  useStorageSync(useBasketStore.persist)
  useStorageSync(useKitchenStore.persist)
  const overrides = useKitchenStore((state) => state.overrides)
  // What the kitchen screen has marked for this table's rounds
  const kitchen = (round: Round) => (kitchenHydrated ? overrides[deviceTicketId(table, round)] : undefined)
  const sent = hydrated ? rounds : []
  const latest = sent.at(-1)
  const progress = latest && now ? roundProgress(latest, now, kitchen(latest)) : null
  const sections = [{ id: "popular" as const, items: dishes.filter((dish) => dish.popular) }, ...CATEGORIES.map((id) => ({ id, items: dishes.filter((dish) => dish.category === id) }))]
  const summary = basketSummary(hydrated ? lines : [])

  // A new table starts a fresh basket.
  useEffect(() => {
    if (hydrated) setTable(table)
  }, [hydrated, table, setTable])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-28">
      <div className="flex flex-col gap-1 px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{t.table.welcome(table)}</h1>
        <p className="text-muted-foreground">{t.table.hint}</p>
        <div className="flex flex-wrap gap-2 pt-3">
          <Button variant="outline" onClick={() => setCallOpen(true)}>
            <BellRingIcon data-icon="inline-start" aria-hidden="true" />
            {t.call.open}
          </Button>
          {sent.length > 0 && (
            <Button variant="outline" onClick={() => setStatusOpen(true)}>
              <ChefHatIcon data-icon="inline-start" aria-hidden="true" />
              {t.status.open}
            </Button>
          )}
        </div>
      </div>

      <nav aria-label={t.categoriesLabel} className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur">
        <ul className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {sections.map((section) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#menu-${section.id}`}
                className="block rounded-full border border-border px-4 py-1.5 font-heading text-sm whitespace-nowrap hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {t.categories[section.id]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section) => (
        <section key={section.id} id={`menu-${section.id}`} aria-labelledby={`menu-${section.id}-title`} className="scroll-mt-32 px-4 pt-8">
          <h2 id={`menu-${section.id}-title`} className="mb-4 font-heading text-xl font-semibold">
            {t.categories[section.id]}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((dish) => (
              <li key={dish.id}>
                <DishCard dish={dish} locale={locale} onOpen={() => setOpen(dish)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <DishSheet dish={open} locale={locale} onClose={() => setOpen(null)} />

      {summary.items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur" data-testid="basket-bar">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1">
            <p className="flex items-center gap-2 text-sm" aria-live="polite">
              <ShoppingBasketIcon className="size-5 text-primary" aria-hidden="true" />
              <span>{t.basket.bar(summary.items)}</span>
              <span className="font-heading font-semibold tabular-nums">{formatBaht(summary.total)}</span>
            </p>
            <Button size="lg" onClick={() => setBasketOpen(true)}>
              {t.basket.view}
            </Button>
          </div>
        </div>
      )}

      {/* With nothing waiting to be sent, the bar follows the latest round instead. */}
      {summary.items === 0 && latest && progress && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur" data-testid="status-bar">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1">
            <p className="flex items-center gap-2 text-sm" aria-live="polite">
              <ChefHatIcon className="size-5 text-primary" aria-hidden="true" />
              {progress.status === "served" ? (
                <span>{t.status.allServed}</span>
              ) : (
                <span className="flex flex-col leading-tight">
                  <span className="font-heading font-medium">{t.status.round(latest.number, bangkokTime(latest.sentAt))}</span>
                  <span className="text-muted-foreground">{t.status.bar(t.status.statuses[progress.status], t.status.eta(progress.minutesLeft))}</span>
                </span>
              )}
            </p>
            <Button size="lg" variant="outline" onClick={() => setStatusOpen(true)}>
              {t.status.open}
            </Button>
          </div>
        </div>
      )}

      <BasketSheet
        table={table}
        locale={locale}
        lines={hydrated ? lines : []}
        open={basketOpen}
        onOpenChange={setBasketOpen}
        onShowStatus={() => {
          setBasketOpen(false)
          setStatusOpen(true)
        }}
      />
      <StatusSheet
        table={table}
        locale={locale}
        rounds={sent}
        kitchen={kitchen}
        now={now}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onSplit={() => {
          setStatusOpen(false)
          setBillOpen(true)
        }}
      />
      <BillSheet rounds={sent} locale={locale} open={billOpen} onOpenChange={setBillOpen} />
      <CallSheet table={table} locale={locale} now={now} open={callOpen} onOpenChange={setCallOpen} />
    </div>
  )
}

function DishCard({ dish, locale, onOpen }: { dish: Dish; locale: Locale; onOpen: () => void }) {
  const t = restaurantMessages[locale]
  const other: Locale = locale === "th" ? "en" : "th"
  return (
    <article className="flex h-full gap-3 rounded-[var(--radius)] border border-border bg-card p-3 sm:flex-col" aria-label={dish.name[locale]}>
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[calc(var(--radius)-0.25rem)] sm:aspect-[4/3] sm:w-full">
        <Image src={dish.image} alt="" fill sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 112px" className="object-cover" />
        {dish.popular && (
          <span className="absolute top-2 left-2 rounded-full bg-signal px-2 py-0.5 font-heading text-xs font-medium text-signal-foreground">{t.dish.popular}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-heading leading-snug font-medium">{dish.name[locale]}</h3>
        <p className="text-xs text-muted-foreground" lang={other}>
          {dish.name[other]}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{dish.description[locale]}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex items-center gap-2">
            <span className="font-heading font-semibold tabular-nums">{formatBaht(dish.price)}</span>
            {dish.spice !== null && <HeatRating level={dish.spice} label={t.dish.heat(dish.spice)} />}
            {dish.vegetarian && <LeafIcon className="size-4 text-leaf" aria-label={t.dish.vegetarian} />}
          </span>
          <Button size="sm" onClick={onOpen} aria-label={t.dish.addLabel(dish.name[locale])}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {t.dish.add}
          </Button>
        </div>
      </div>
    </article>
  )
}

function DishSheet({ dish, locale, onClose }: { dish: Dish | null; locale: Locale; onClose: () => void }) {
  return (
    <Drawer open={!!dish} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg">{dish && <DishForm key={dish.id} dish={dish} locale={locale} onDone={onClose} />}</DrawerContent>
    </Drawer>
  )
}

function DishForm({ dish, locale, onDone }: { dish: Dish; locale: Locale; onDone: () => void }) {
  const t = restaurantMessages[locale]
  const add = useBasketStore((state) => state.add)
  const [spice, setSpice] = useState<SpiceLevel | null>(dish.spice)
  const [addOns, setAddOns] = useState<AddOnId[]>([])
  const [note, setNote] = useState("")
  const [quantity, setQuantity] = useState(1)
  const id = useId()
  const total = unitPrice(dish, addOns) * quantity

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        add({ dishId: dish.id, quantity, spice, addOns, note })
        toast.success(t.sheet.added(dish.name[locale]))
        onDone()
      }}
    >
      <div className="overflow-y-auto overscroll-contain px-4">
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-[calc(var(--radius)-0.25rem)]">
          <Image src={dish.image} alt="" fill sizes="512px" className="object-cover" />
        </div>
        <DrawerHeader className="px-0 pt-0 text-left">
          <DrawerTitle className="font-heading text-2xl font-semibold">{dish.name[locale]}</DrawerTitle>
          <DrawerDescription>{dish.description[locale]}</DrawerDescription>
          {dish.contains && (
            <p className="text-xs text-muted-foreground">
              {t.dish.containsLabel}: {dish.contains.map((item) => t.dish.contains[item]).join(", ")}
            </p>
          )}
        </DrawerHeader>

        <div className="flex flex-col gap-6 pb-4">
          {dish.spice !== null && (
            <FieldSet>
              <FieldLegend variant="label" className="font-heading font-medium">
                {t.sheet.spice} <span className="font-body font-normal text-muted-foreground">{t.sheet.spiceHint}</span>
              </FieldLegend>
              <RadioGroup value={String(spice)} onValueChange={(value) => setSpice(Number(value) as SpiceLevel)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SPICE_LEVELS.map((level) => (
                  <FieldLabel key={level} htmlFor={`${id}-spice-${level}`} className="rounded-[calc(var(--radius)-0.25rem)] border border-border px-3 py-2.5 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-secondary">
                    <RadioGroupItem value={String(level)} id={`${id}-spice-${level}`} />
                    <span className="flex-1">{t.sheet.spiceLevels[level]}</span>
                    <span className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 4 }, (_, i) => (
                        <Chili key={i} filled={i < level} className={cn(i >= level && "opacity-30")} />
                      ))}
                    </span>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>
          )}

          {dish.addOns.length > 0 && (
            <FieldSet>
              <FieldLegend variant="label" className="font-heading font-medium">
                {t.sheet.addOns}
              </FieldLegend>
              <div className="flex flex-col gap-2">
                {dish.addOns.map((addOn) => {
                  const checked = addOns.includes(addOn)
                  const price = ADD_ONS[addOn].price
                  return (
                    <FieldLabel key={addOn} htmlFor={`${id}-${addOn}`} className="rounded-[calc(var(--radius)-0.25rem)] border border-border px-3 py-2.5 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-secondary">
                      <Checkbox
                        id={`${id}-${addOn}`}
                        checked={checked}
                        onCheckedChange={(value) => setAddOns((current) => (value ? [...current, addOn] : current.filter((item) => item !== addOn)))}
                      />
                      <span className="flex-1">{t.sheet.addOnNames[addOn]}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{price ? `+${formatBaht(price)}` : t.sheet.free}</span>
                    </FieldLabel>
                  )
                })}
              </div>
            </FieldSet>
          )}

          <Field>
            <FieldLabel htmlFor={`${id}-note`} className="font-heading font-medium">
              {t.sheet.note}
            </FieldLabel>
            <Input id={`${id}-note`} value={note} maxLength={NOTE_MAX} placeholder={t.sheet.notePlaceholder} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </div>
      </div>

      <DrawerFooter className="flex-row items-center gap-3 border-t border-border">
        <div className="flex items-center rounded-[calc(var(--radius)-0.25rem)] border border-input" role="group" aria-label={t.sheet.quantity}>
          <Button type="button" variant="ghost" size="icon-lg" aria-label={t.sheet.decrease} disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <MinusIcon aria-hidden="true" />
          </Button>
          <output className="w-8 text-center font-heading font-medium tabular-nums" data-testid="dish-quantity">
            {quantity}
          </output>
          <Button type="button" variant="ghost" size="icon-lg" aria-label={t.sheet.increase} disabled={quantity >= MAX_QUANTITY} onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}>
            <PlusIcon aria-hidden="true" />
          </Button>
        </div>
        <Button type="submit" size="lg" className="flex-1">
          {t.sheet.addToOrder(formatBaht(total))}
        </Button>
      </DrawerFooter>
    </form>
  )
}

/** Spice, extras and note for a basket line, in a few words. */
function lineDetails(line: BasketLine, locale: Locale): string {
  const t = restaurantMessages[locale]
  return [line.spice !== null ? t.sheet.spiceLevels[line.spice] : null, ...line.addOns.map((id) => t.sheet.addOnNames[id]), line.note ? `"${line.note}"` : null]
    .filter(Boolean)
    .join(", ")
}

function BasketSheet({
  table,
  locale,
  lines,
  open,
  onOpenChange,
  onShowStatus,
}: {
  table: number
  locale: Locale
  lines: BasketLine[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowStatus: () => void
}) {
  const t = restaurantMessages[locale]
  const setQuantity = useBasketStore((state) => state.setQuantity)
  const send = useBasketStore((state) => state.send)
  const [sentRound, setSentRound] = useState<Round | null>(null)
  const summary = basketSummary(lines)

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setSentRound(null)
      }}
    >
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg" data-testid="basket-sheet">
        {sentRound ? (
          <div className="flex flex-col items-start gap-4 px-4 pt-2 pb-8" role="status">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckIcon className="size-6" aria-hidden="true" />
            </span>
            <DrawerTitle className="font-heading text-2xl font-semibold">{t.basket.sentTitle(sentRound.number)}</DrawerTitle>
            <DrawerDescription className="text-base">{t.basket.sentBody}</DrawerDescription>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setSentRound(null)
                  onOpenChange(false)
                }}
              >
                {t.basket.backToMenu}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSentRound(null)
                  onShowStatus()
                }}
              >
                {t.status.open}
              </Button>
            </div>
          </div>
        ) : (
          <>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-2xl font-semibold">{t.basket.title(table)}</DrawerTitle>
          <DrawerDescription>{t.basket.description}</DrawerDescription>
        </DrawerHeader>
        {lines.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-4 pb-6">
            <p className="text-muted-foreground">{t.basket.empty}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.basket.keepBrowsing}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border overflow-y-auto overscroll-contain px-4">
              {lines.map((line) => {
                const dish = getDish(line.dishId)
                if (!dish) return null
                const key = lineKey(line)
                const details = lineDetails(line, locale)
                return (
                  <li key={key} className="flex items-start gap-3 py-3" data-testid="basket-line">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[calc(var(--radius)-0.375rem)]">
                      <Image src={dish.image} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-medium">{dish.name[locale]}</p>
                      {details && <p className="text-sm text-muted-foreground">{details}</p>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-[calc(var(--radius)-0.375rem)] border border-input" role="group" aria-label={`${t.sheet.quantity}: ${dish.name[locale]}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={line.quantity === 1 ? t.basket.remove(dish.name[locale]) : t.sheet.decrease}
                            onClick={() => setQuantity(key, line.quantity - 1)}
                          >
                            <MinusIcon aria-hidden="true" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                          <Button variant="ghost" size="icon-sm" aria-label={t.sheet.increase} disabled={line.quantity >= MAX_QUANTITY} onClick={() => setQuantity(key, line.quantity + 1)}>
                            <PlusIcon aria-hidden="true" />
                          </Button>
                        </div>
                        <span className="font-heading font-medium tabular-nums">{formatBaht(lineTotal(line))}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <DrawerFooter className="border-t border-border">
              <p className="flex items-baseline justify-between font-heading">
                <span>{t.basket.total}</span>
                <span className="text-2xl font-semibold tabular-nums" data-testid="basket-total">
                  {formatBaht(summary.total)}
                </span>
              </p>
              <Button size="xl" onClick={() => setSentRound(send(new Date()))}>
                <ChefHatIcon data-icon="inline-start" aria-hidden="true" />
                {t.basket.send}
              </Button>
            </DrawerFooter>
          </>
        )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

/** "19:42" in Bangkok, whatever the phone's timezone. */
function bangkokTime(iso: string): string {
  const bangkok = new Date(Date.parse(iso) + 7 * 3_600_000)
  return `${String(bangkok.getUTCHours()).padStart(2, "0")}:${String(bangkok.getUTCMinutes()).padStart(2, "0")}`
}

const statusTones: Record<DishStatus, string> = {
  received: "bg-muted text-muted-foreground",
  cooking: "bg-accent text-accent-foreground",
  served: "bg-secondary text-primary",
}

function StatusChip({ status, locale }: { status: DishStatus; locale: Locale }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-heading text-xs font-medium", statusTones[status])}>
      {restaurantMessages[locale].status.statuses[status]}
    </span>
  )
}

function StatusSheet({
  table,
  locale,
  rounds,
  kitchen,
  now,
  open,
  onOpenChange,
  onSplit,
}: {
  table: number
  locale: Locale
  rounds: Round[]
  kitchen: (round: Round) => DishStatus | undefined
  now: Date | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSplit: () => void
}) {
  const t = restaurantMessages[locale]
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg" data-testid="status-sheet">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-2xl font-semibold">{t.status.title(table)}</DrawerTitle>
          <DrawerDescription>{t.status.description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-6 overflow-y-auto overscroll-contain px-4 pb-4">
          {now &&
            [...rounds].reverse().map((round) => {
              const progress = roundProgress(round, now, kitchen(round))
              return (
                <section key={round.number} aria-label={t.status.round(round.number, bangkokTime(round.sentAt))} data-testid="status-round">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="font-heading font-medium">{t.status.round(round.number, bangkokTime(round.sentAt))}</h3>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {progress.status === "served" ? t.status.served(progress.served, round.lines.length) : t.status.eta(progress.minutesLeft)}
                    </span>
                  </div>
                  <ul className="flex flex-col divide-y divide-border rounded-[calc(var(--radius)-0.25rem)] border border-border">
                    {round.lines.map((line, index) => {
                      const dish = getDish(line.dishId)
                      if (!dish) return null
                      const details = lineDetails(line, locale)
                      return (
                        <li key={index} className="flex items-center justify-between gap-3 px-3 py-2.5" data-testid="status-line">
                          <div className="min-w-0">
                            <p className="font-medium">
                              {dish.name[locale]} × {line.quantity}
                            </p>
                            {details && <p className="text-sm text-muted-foreground">{details}</p>}
                          </div>
                          <StatusChip status={lineStatus(round, index, now, kitchen(round))} locale={locale} />
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
        </div>
        <DrawerFooter className="border-t border-border">
          <p className="flex items-baseline justify-between font-heading">
            <span>{t.status.soFar}</span>
            <span className="text-2xl font-semibold tabular-nums" data-testid="status-total">
              {formatBaht(roundsTotal(rounds))}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{t.status.pay}</p>
          <Button variant="outline" size="lg" onClick={onSplit}>
            {t.bill.open}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function CallSheet({ table, locale, now, open, onOpenChange }: { table: number; locale: Locale; now: Date | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = restaurantMessages[locale]
  const calls = useBasketStore((state) => state.calls)
  const call = useBasketStore((state) => state.call)
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg" data-testid="call-sheet">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-2xl font-semibold">{t.call.title}</DrawerTitle>
          <DrawerDescription>{t.call.description(table)}</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-2 px-4 pb-6 sm:grid-cols-2">
          {CALL_REASONS.map((reason) => {
            const waiting = !!now && !canCall(calls[reason], now)
            return (
              <Button
                key={reason}
                variant="outline"
                size="xl"
                disabled={waiting}
                className="h-auto justify-between py-3 whitespace-normal"
                onClick={() => {
                  if (call(reason, new Date())) toast.success(t.call.sent(table))
                  onOpenChange(false)
                }}
              >
                <span className="text-left">{t.call.reasons[reason]}</span>
                {waiting && <span className="shrink-0 text-xs text-primary">{t.call.recently}</span>}
              </Button>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
