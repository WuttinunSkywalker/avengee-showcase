"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useShopAdminData } from "../../hooks/use-shop-admin-data"
import { shopMessages } from "../../i18n/messages"
import { getProduct } from "../../data/products"
import {
  createAdjustment,
  inventoryRows,
  inventoryTotals,
  MAX_STOCK,
  restockHistory,
  type AdjustmentKind,
  type InventoryRow,
  type StockAdjustment,
  type StockLevel,
} from "../../lib/inventory"
import { formatBaht, formatShortDate } from "../../lib/format"
import { bangkokDate, bangkokTime } from "../../lib/tracking"
import { useInventoryStore } from "../../store/inventory-store"

type Filter = "all" | "low" | "out"

const levelTones: Record<StockLevel, string> = {
  out: "bg-destructive/10 text-destructive ring-destructive/30",
  low: "bg-roast-2/20 text-foreground ring-roast-2/50",
  ok: "bg-leaf/12 text-leaf ring-leaf/40",
}

function LevelBadge({ level, locale }: { level: StockLevel; locale: Locale }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", levelTones[level])}>
      {shopMessages[locale].admin.inventory.level[level]}
    </span>
  )
}

export function ShopInventory() {
  const locale = useLocale()
  const s = shopMessages[locale]
  const t = s.admin.inventory
  const data = useShopAdminData()
  const [filter, setFilter] = useState<Filter>("all")
  const [editing, setEditing] = useState<InventoryRow | null>(null)

  if (!data.ready) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const rows = inventoryRows(data.products)
  const totals = inventoryTotals(rows)
  const visible = rows.filter((row) => filter === "all" || (filter === "low" ? row.level !== "ok" : row.level === "out"))
  const log = [...data.adjustments, ...restockHistory(data.now)].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14)
  const deviceIds = new Set(data.adjustments.map((adjustment) => adjustment.id))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:110%]">{t.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.hint}</p>
      </div>

      <section aria-label={t.title} className="grid grid-cols-3 gap-2 sm:gap-4">
        <Tile label={t.onShelf} value={formatNumber(totals.units)} detail={t.onShelfDetail} testId="inventory-units" />
        <Tile label={t.outCount} value={formatNumber(totals.out)} tone={totals.out ? "text-destructive" : undefined} testId="inventory-out" />
        <Tile label={t.lowCount} value={formatNumber(totals.low)} testId="inventory-low" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={filter}
            onValueChange={(value) => value && setFilter(value as Filter)}
            aria-label={t.filterLabel}
            className="flex-wrap justify-start"
          >
            {(["all", "low", "out"] as const).map((value) => (
              <ToggleGroupItem key={value} value={value} className="px-3">
                {t.filter[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.columns.coffee}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.columns.price}</TableHead>
                    <TableHead className="text-right">{t.columns.stock}</TableHead>
                    <TableHead className="hidden md:table-cell">{t.columns.level}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t.update}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((row) => {
                    const size = s.detail.sizeLabel(row.amount, row.product.kind)
                    return (
                      <TableRow key={row.key} data-testid="inventory-row" data-level={row.level}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* The bag's colour is enough at this size; the full artwork's label would be unreadable. */}
                            <span aria-hidden="true" className="h-8 w-6 shrink-0 rounded-[3px] shadow-sm" style={{ backgroundColor: row.product.bag }} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{row.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {size}
                                <span className="md:hidden">, {t.level[row.level]}</span>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">{formatBaht(row.price)}</TableCell>
                        <TableCell
                          className={cn("text-right font-heading text-lg font-extrabold tabular-nums", row.level === "out" && "text-destructive")}
                          data-testid="inventory-stock"
                        >
                          {row.stock}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <LevelBadge level={row.level} locale={locale} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setEditing(row)} aria-label={t.updateLabel(row.product.name, size)}>
                            <PencilIcon className="sm:hidden" aria-hidden="true" />
                            <span className="hidden sm:inline">{t.update}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <RestockLog log={log} deviceIds={deviceIds} />
      </div>

      <AdjustDialog row={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function Tile({ label, value, detail, tone, testId }: { label: string; value: string; detail?: string; tone?: string; testId: string }) {
  return (
    <Card className="gap-1 max-sm:[--card-spacing:--spacing(3)]">
      <CardHeader>
        <CardDescription className="text-xs sm:text-sm">{label}</CardDescription>
        <CardTitle className={cn("font-heading text-2xl font-extrabold tabular-nums [font-stretch:110%] sm:text-3xl", tone)} data-testid={testId}>
          {value}
        </CardTitle>
      </CardHeader>
      {detail && <CardContent className="hidden text-sm text-muted-foreground sm:block">{detail}</CardContent>}
    </Card>
  )
}

function RestockLog({ log, deviceIds }: { log: StockAdjustment[]; deviceIds: Set<string> }) {
  const locale = useLocale()
  const s = shopMessages[locale]
  const t = s.admin.inventory.log
  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.body}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col divide-y divide-border" data-testid="restock-log">
          {log.map((entry) => {
            const product = getProduct(entry.productId)
            const at = new Date(entry.at)
            const note = entry.noteKey ? t.notes[entry.noteKey] : entry.note
            return (
              <li key={entry.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {product?.name}, {product ? s.detail.sizeLabel(entry.amount, product.kind) : entry.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(bangkokDate(at), locale)} {bangkokTime(at)}
                    {note ? `, ${note}` : ""}
                    {deviceIds.has(entry.id) && <span className="text-leaf">, {t.here}</span>}
                  </p>
                </div>
                <span className={cn("shrink-0 font-medium tabular-nums", entry.delta > 0 ? "text-leaf" : "text-destructive")}>
                  {entry.kind === "restock" ? t.restocked(entry.delta) : t.counted(entry.delta)}
                </span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

function AdjustDialog({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{row && <AdjustForm key={row.key} row={row} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

function AdjustForm({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const locale = useLocale()
  const s = shopMessages[locale]
  const t = s.admin.inventory
  const add = useInventoryStore((state) => state.add)
  const remove = useInventoryStore((state) => state.remove)
  const [kind, setKind] = useState<AdjustmentKind>("restock")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const size = s.detail.sizeLabel(row.amount, row.product.kind)

  const parsed = /^\d+$/.test(quantity.trim()) ? Number(quantity.trim()) : NaN
  const valid = kind === "restock" ? parsed >= 1 && parsed <= MAX_STOCK : parsed >= 0 && parsed <= MAX_STOCK
  const next = valid ? Math.min(MAX_STOCK, kind === "restock" ? row.stock + parsed : parsed) : null

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!valid) return setError(kind === "restock" ? t.dialog.errors.restock : t.dialog.errors.count)
    const adjustment = createAdjustment({ productId: row.product.id, amount: row.amount, kind, quantity: parsed, note }, row.stock, new Date())
    if (!adjustment) return setError(t.dialog.errors.same)
    add(adjustment)
    onClose()
    toast.success(t.saved(row.product.name, size, next!), { action: { label: t.undo, onClick: () => remove(adjustment.id) } })
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>
          {row.product.name}, {size}
        </DialogTitle>
        <DialogDescription>{t.dialog.now(row.stock)}</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">{t.dialog.mode}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={kind}
            onValueChange={(value) => {
              if (!value) return
              setKind(value as AdjustmentKind)
              setError(null)
            }}
            aria-label={t.dialog.mode}
          >
            <ToggleGroupItem value="restock" className="px-3">
              {t.dialog.restock}
            </ToggleGroupItem>
            <ToggleGroupItem value="count" className="px-3">
              {t.dialog.count}
            </ToggleGroupItem>
          </ToggleGroup>
        </FieldSet>
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor="stock-quantity">{kind === "restock" ? t.dialog.quantityRestock : t.dialog.quantityCount}</FieldLabel>
          <Input
            id="stock-quantity"
            inputMode="numeric"
            autoComplete="off"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value.replace(/[^\d]/g, "").slice(0, 3))
              setError(null)
            }}
            aria-invalid={!!error}
            className="tabular-nums"
            autoFocus
          />
          {error ? <FieldError>{error}</FieldError> : next !== null && <FieldDescription data-testid="stock-preview">{t.dialog.preview(row.stock, next)}</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="stock-note">{t.dialog.note}</FieldLabel>
          <Input id="stock-note" value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} placeholder={t.dialog.notePlaceholder} />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t.dialog.cancel}
        </Button>
        <Button type="submit">{t.dialog.save}</Button>
      </DialogFooter>
    </form>
  )
}
