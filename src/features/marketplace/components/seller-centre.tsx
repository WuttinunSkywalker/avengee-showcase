"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ExternalLinkIcon, TruckIcon } from "lucide-react"
import { toast } from "sonner"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatDayMonth, formatLongDate, formatShortDate } from "@/lib/dates"
import { formatBaht, formatBahtCompact, formatPercent } from "@/lib/format"
import { getProvince } from "@/lib/thailand"
import { sellers } from "../data/sellers"
import { marketplaceMessages } from "../i18n/messages"
import { bangkokDay, STAGES, type Stage } from "../lib/orders"
import { COMMISSION, dealerSales, netOf, overview, payoutSummary, weeklyPayouts, type Sale } from "../lib/seller"
import { useListingEdits } from "../hooks/use-basket"
import { useListingsStore, usePurchasesStore } from "../store/basket-store"
import { SellerListings as Listings } from "./seller-listings"
import { TaladWordmark } from "./marketplace-header"

const VIEWS = ["overview", "orders", "listings", "payouts"] as const
type View = (typeof VIEWS)[number]

const stageVariant: Record<Stage, "default" | "secondary" | "outline"> = { packing: "default", shipped: "secondary", delivered: "secondary", received: "outline" }

/**
 * Where a dealer runs their Talad shop: what sold, what to pack, and the
 * money Talad is holding or has paid out. The shop and tab live in the URL.
 */
export function SellerCentre() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const seller = sellers.find((entry) => entry.id === params.get("dealer")) ?? sellers[0]
  const view: View = VIEWS.includes(params.get("view") as View) ? (params.get("view") as View) : "overview"
  const stageFilter = STAGES.includes(params.get("stage") as Stage) ? (params.get("stage") as Stage) : null

  const go = (next: { dealer?: string; view?: View; stage?: Stage | null }) => {
    const query = new URLSearchParams()
    query.set("dealer", next.dealer ?? seller.id)
    const nextView = next.view ?? view
    if (nextView !== "overview") query.set("view", nextView)
    const nextStage = next.stage === undefined ? stageFilter : next.stage
    if (nextView === "orders" && nextStage) query.set("stage", nextStage)
    router.replace(`${pathname}?${query}`, { scroll: false })
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <TaladWordmark />
          <span className="text-sm text-muted-foreground">{t.centre.title}</span>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle label={locale === "th" ? "สลับโหมดมืด" : "Toggle dark mode"} />
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:basis-full">
            <Select value={seller.id} onValueChange={(dealer) => go({ dealer, stage: null })}>
              <SelectTrigger className="w-60 bg-card" aria-label={t.centre.dealer}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sellers.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="ghost" size="sm">
              <Link href={localePath(locale, `/marketplace/dealers/${seller.id}`)}>
                <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
                {t.centre.viewShop}
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="font-heading text-3xl">{seller.name[locale]}</h1>
        <Tabs value={view} onValueChange={(next) => go({ view: next as View })}>
          <TabsList aria-label={t.centre.tabsLabel}>
            {VIEWS.map((entry) => (
              <TabsTrigger key={entry} value={entry} className="text-muted-foreground">
                {t.centre.tabs[entry]}
              </TabsTrigger>
            ))}
          </TabsList>
          <CentreBody sellerId={seller.id} view={view} stage={stageFilter} locale={locale} onView={(next) => go({ view: next })} onStage={(stage) => go({ stage })} />
        </Tabs>
      </main>
    </div>
  )
}

function CentreBody({ sellerId, view, stage, locale, onView, onStage }: { sellerId: string; view: View; stage: Stage | null; locale: Locale; onView: (view: View) => void; onStage: (stage: Stage | null) => void }) {
  const now = useNow()
  const ready = usePersistHydrated(usePurchasesStore.persist)
  const purchases = usePurchasesStore((state) => state.purchases)
  const minute = now ? Math.floor(now.getTime() / 60_000) : null
  const { ready: editsReady, edits } = useListingEdits()
  useStorageSync(usePurchasesStore.persist)
  const sales = useMemo(
    () => (minute === null || !ready || !editsReady ? null : dealerSales(sellerId, new Date(minute * 60_000), purchases, edits.shipped)),
    [sellerId, minute, ready, editsReady, purchases, edits.shipped],
  )

  if (!now || !sales) {
    return (
      <div className="grid gap-4 pt-4 md:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
        <Skeleton className="h-72 md:col-span-4" />
      </div>
    )
  }

  return (
    <>
      <TabsContent value="overview" className="pt-4">
        {view === "overview" && <Overview sales={sales} now={now} locale={locale} onAllOrders={() => onView("orders")} />}
      </TabsContent>
      <TabsContent value="orders" className="pt-4">
        {view === "orders" && <Orders sales={sales} stage={stage} locale={locale} onStage={onStage} />}
      </TabsContent>
      <TabsContent value="listings" className="pt-4">
        {view === "listings" && <Listings sellerId={sellerId} locale={locale} />}
      </TabsContent>
      <TabsContent value="payouts" className="pt-4">
        {view === "payouts" && <Payouts sales={sales} now={now} locale={locale} />}
      </TabsContent>
    </>
  )
}

const day = (at: number, locale: Locale) => formatShortDate(bangkokDay(at), locale)

function Overview({ sales, now, locale, onAllOrders }: { sales: Sale[]; now: Date; locale: Locale; onAllOrders: () => void }) {
  const t = marketplaceMessages[locale].centre
  const stats = overview(sales, now)
  const money = payoutSummary(sales, now)
  const weeks = weeklyPayouts(money.paid, now)
  const total = weeks.reduce((sum, week) => sum + week.amount, 0)
  const chartConfig = { amount: { label: t.tabs.payouts, color: "var(--primary)" } } satisfies ChartConfig

  const kpis: [string, string, string, string][] = [
    [t.kpi.revenue, formatBaht(stats.revenue30), t.kpi.orders(stats.orders30), "kpi-revenue"],
    [t.kpi.toPack, String(stats.toPack), stats.toPack ? t.kpi.toPackHint : t.kpi.toPackDone, "kpi-to-pack"],
    [t.kpi.held, formatBaht(money.held), t.kpi.heldHint, "kpi-held"],
    [t.kpi.next, money.next ? formatBaht(money.next.amount) : t.kpi.nextNone, money.next ? formatLongDate(bangkokDay(money.next.paidAt), locale) : "", "kpi-next"],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map(([label, value, hint, id]) => (
          <Card key={id} className="gap-1">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-heading text-2xl font-normal tabular-nums sm:text-3xl" data-testid={id}>
                {value}
              </CardTitle>
              {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-normal">{t.chartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" role="img" aria-label={t.chartAria(formatBaht(total))}>
              <BarChart data={weeks} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="paidAt" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" tickFormatter={(value: number) => formatDayMonth(bangkokDay(value), locale)} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(value: number) => formatBahtCompact(value)} />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const at = payload?.[0]?.payload?.paidAt as number | undefined
                        return at ? formatLongDate(bangkokDay(at), locale) : ""
                      }}
                      formatter={(value) => <span className="font-medium tabular-nums">{formatBaht(Number(value))}</span>}
                    />
                  }
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-xl font-normal">{t.recent}</CardTitle>
            <Button variant="link" className="h-auto p-0" onClick={onAllOrders}>
              {t.allOrders}
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border" data-testid="recent-orders">
              {sales.slice(0, 5).map((sale) => (
                <li key={`${sale.reference}-${sale.piece.en}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sale.piece[locale]}</p>
                    <p className="text-muted-foreground">
                      {t.placedBy(sale.buyer[locale], day(sale.placedAt, locale))}
                    </p>
                  </div>
                  <StageBadge stage={sale.stage} locale={locale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StageBadge({ stage, locale }: { stage: Stage; locale: Locale }) {
  return (
    <Badge variant={stageVariant[stage]} className="shrink-0">
      {marketplaceMessages[locale].order.stages[stage]}
    </Badge>
  )
}

const PAGE = 20

function Orders({ sales, stage, locale, onStage }: { sales: Sale[]; stage: Stage | null; locale: Locale; onStage: (stage: Stage | null) => void }) {
  const t = marketplaceMessages[locale].centre
  const filtered = stage ? sales.filter((sale) => sale.stage === stage) : sales
  const [limit, setLimit] = useState(PAGE)
  const shown = filtered.slice(0, limit)
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={stage ?? "all"}
        onValueChange={(value) => {
          if (!value) return
          setLimit(PAGE)
          onStage(value === "all" ? null : (value as Stage))
        }} aria-label={t.filter} className="flex-wrap justify-start">
        <ToggleGroupItem value="all" className="px-3">
          {t.all} <span className="text-muted-foreground tabular-nums">{sales.length}</span>
        </ToggleGroupItem>
        {STAGES.map((entry) => (
          <ToggleGroupItem key={entry} value={entry} className="px-3">
            {marketplaceMessages[locale].order.stages[entry]} <span className="text-muted-foreground tabular-nums">{sales.filter((sale) => sale.stage === entry).length}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* Phones get a stacked list; the table needs room for its six columns */}
      <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-card md:hidden" data-testid="orders-list">
        {shown.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{t.empty}</li>}
        {shown.map((sale) => (
          <li key={`${sale.reference}-${sale.piece.en}`} className="flex flex-col gap-1 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{sale.piece[locale]}</p>
              <StageBadge stage={sale.stage} locale={locale} />
            </div>
            {sale.stage === "packing" && <ShipButton sale={sale} locale={locale} className="self-start" />}
            <p className="text-muted-foreground">
              {t.placedFrom(sale.buyer[locale], getProvince(sale.provinceId)?.name[locale] ?? "", day(sale.placedAt, locale))}
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-xs tabular-nums text-muted-foreground">
                {sale.reference}
                {sale.yours && <span className="ml-2 text-primary">{t.fromYou}</span>}
              </span>
              <span className="tabular-nums">{formatBaht(netOf(sale))}</span>
            </p>
          </li>
        ))}
      </ul>
      <Card className="hidden py-0 md:flex">
        <CardContent className="px-0">
          <Table data-testid="orders-table">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t.columns.order}</TableHead>
                <TableHead>{t.columns.placed}</TableHead>
                <TableHead>{t.columns.buyer}</TableHead>
                <TableHead>{t.columns.piece}</TableHead>
                <TableHead className="text-right">{t.columns.total}</TableHead>
                <TableHead className="pr-4">{t.columns.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {t.empty}
                  </TableCell>
                </TableRow>
              ) : (
                shown.map((sale) => (
                  <TableRow key={`${sale.reference}-${sale.piece.en}`}>
                    <TableCell className="pl-4">
                      <span className="font-medium tabular-nums">{sale.reference}</span>
                      {sale.yours && <span className="block text-xs text-primary">{t.fromYou}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{day(sale.placedAt, locale)}</TableCell>
                    <TableCell>
                      {sale.buyer[locale]}
                      <span className="block text-xs text-muted-foreground">{getProvince(sale.provinceId)?.name[locale]}</span>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">{sale.piece[locale]}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBaht(netOf(sale))}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        <StageBadge stage={sale.stage} locale={locale} />
                        {sale.stage === "packing" && <ShipButton sale={sale} locale={locale} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {filtered.length > shown.length && (
        <Button variant="outline" className="self-center" onClick={() => setLimit((current) => current + PAGE)}>
          {t.showMore(filtered.length - shown.length)}
        </Button>
      )}
    </div>
  )
}

function Payouts({ sales, now, locale }: { sales: Sale[]; now: Date; locale: Locale }) {
  const t = marketplaceMessages[locale].centre
  const money = payoutSummary(sales, now)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">{t.payouts.title}</CardTitle>
          <CardDescription>{t.payouts.account}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p>{t.payouts.how(formatPercent(COMMISSION))}</p>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-border pt-4">
            <dt className="text-muted-foreground">{t.kpi.held}</dt>
            <dd className="text-right tabular-nums" data-testid="payout-held">
              {formatBaht(money.held)}
            </dd>
            <dt className="text-muted-foreground">{t.kpi.next}</dt>
            <dd className="text-right tabular-nums">{money.next ? `${formatBaht(money.next.amount)}, ${day(money.next.paidAt, locale)}` : t.kpi.nextNone}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card className="py-0">
        <CardContent className="px-0">
          <Table data-testid="payouts-table">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t.payouts.paidAt}</TableHead>
                <TableHead className="text-right">{t.payouts.orders}</TableHead>
                <TableHead className="pr-4 text-right">{t.payouts.amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {money.paid.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    {t.payouts.none}
                  </TableCell>
                </TableRow>
              ) : (
                money.paid.map((payout) => (
                  <TableRow key={payout.paidAt}>
                    <TableCell className="pl-4">{formatLongDate(bangkokDay(payout.paidAt), locale)}</TableCell>
                    <TableCell className="text-right tabular-nums">{payout.sales}</TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular-nums">{formatBaht(payout.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/** The dealer has handed the parcel to the courier: the buyer sees it move straight away. */
function ShipButton({ sale, locale, className }: { sale: Sale; locale: Locale; className?: string }) {
  const t = marketplaceMessages[locale].centre
  const markShipped = useListingsStore((state) => state.markShipped)
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      aria-label={t.markShippedLabel(sale.reference)}
      onClick={() => {
        // Stamped at the start of the previous minute: screens re-read the clock every 30–60 seconds,
        // and a mark a few seconds "in the future" would leave the parcel looking unsent until then.
        markShipped(sale.reference, new Date((Math.floor(Date.now() / 60_000) - 1) * 60_000))
        toast.success(t.shippedToast(sale.reference))
      }}
    >
      <TruckIcon data-icon="inline-start" aria-hidden="true" />
      {t.markShipped}
    </Button>
  )
}
