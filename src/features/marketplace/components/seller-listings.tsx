"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { EyeIcon, EyeOffIcon, PencilIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { localePath, type Locale } from "@/i18n/config"
import { formatBaht } from "@/lib/format"
import type { Item } from "../data/items"
import { useLiveItems } from "../hooks/use-basket"
import { marketplaceMessages } from "../i18n/messages"
import { itemPath } from "./item-card"
import { NewListing } from "./new-listing"
import { parsePrice, validPrice } from "../lib/listings"
import { useListingsStore } from "../store/basket-store"

type Status = "forSale" | "sold" | "hidden"
const statusOf = (item: Item): Status => (item.sold ? "sold" : item.hidden ? "hidden" : "forSale")
const statusVariant: Record<Status, "default" | "secondary" | "outline"> = { forSale: "default", sold: "outline", hidden: "secondary" }

/** Every piece this dealer has listed: change a price, or take a piece down and put it back. */
export function SellerListings({ sellerId, locale }: { sellerId: string; locale: Locale }) {
  const t = marketplaceMessages[locale].centre.listings
  const own = useLiveItems().filter((item) => item.seller === sellerId)
  const toggleHidden = useListingsStore((state) => state.toggleHidden)
  const [editing, setEditing] = useState<Item | null>(null)
  const forSale = own.filter((item) => statusOf(item) === "forSale").length

  const toggle = (item: Item) => {
    toggleHidden(item.id)
    toast(item.hidden ? t.backUp(item.name[locale]) : t.takenDown(item.name[locale]))
  }

  const actions = (item: Item) =>
    item.sold ? null : (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" aria-label={t.editPriceLabel(item.name[locale])} onClick={() => setEditing(item)}>
          <PencilIcon data-icon="inline-start" aria-hidden="true" />
          {t.editPrice}
        </Button>
        <Button size="sm" variant="ghost" aria-label={item.hidden ? t.putBackLabel(item.name[locale]) : t.takeDownLabel(item.name[locale])} onClick={() => toggle(item)}>
          {item.hidden ? <EyeIcon data-icon="inline-start" aria-hidden="true" /> : <EyeOffIcon data-icon="inline-start" aria-hidden="true" />}
          {item.hidden ? t.putBack : t.takeDown}
        </Button>
      </div>
    )

  const thumb = (item: Item) => (
    <div className="relative size-12 shrink-0 overflow-clip rounded-[calc(var(--radius)-2px)] bg-plinth">
      <Image src={item.image} unoptimized={item.local} alt="" fill sizes="48px" className={item.fit === "contain" ? "object-contain p-1" : "object-cover"} />
    </div>
  )
  const name = (item: Item) => (
    <Link href={localePath(locale, itemPath(item))} className="rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {item.name[locale]}
    </Link>
  )
  const badge = (item: Item) => <Badge variant={statusVariant[statusOf(item)]}>{t.statuses[statusOf(item)]}</Badge>

  return (
    <div className="flex flex-col gap-4" data-testid="listings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" data-testid="listings-count">
          {t.count(forSale, own.length)}
        </p>
        <NewListing sellerId={sellerId} locale={locale} />
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-card md:hidden">
        {own.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 p-4 text-sm" data-testid="listing">
            <div className="flex items-start gap-3">
              {thumb(item)}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {name(item)}
                <span className="font-heading tabular-nums">{formatBaht(item.price)}</span>
              </div>
              {badge(item)}
            </div>
            {actions(item)}
          </li>
        ))}
      </ul>
      <Card className="hidden py-0 md:flex">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t.columns.piece}</TableHead>
                <TableHead className="text-right">{t.columns.price}</TableHead>
                <TableHead>{t.columns.status}</TableHead>
                <TableHead className="pr-4">{t.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {own.map((item) => (
                <TableRow key={item.id} data-testid="listing">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      {thumb(item)}
                      {name(item)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-heading tabular-nums">{formatBaht(item.price)}</TableCell>
                  <TableCell>{badge(item)}</TableCell>
                  <TableCell className="pr-4">{actions(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PriceDialog item={editing} locale={locale} onClose={() => setEditing(null)} />
    </div>
  )
}

function PriceDialog({ item, locale, onClose }: { item: Item | null; locale: Locale; onClose: () => void }) {
  const t = marketplaceMessages[locale].centre.listings
  const setPrice = useListingsStore((state) => state.setPrice)
  const [text, setText] = useState("")
  const [error, setError] = useState(false)

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {item && (
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={() => setText(String(item.price))}>
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              const price = parsePrice(text)
              if (!validPrice(price)) {
                setError(true)
                return
              }
              setPrice(item.id, price)
              toast.success(t.priceSaved(item.name[locale], formatBaht(price)))
              setError(false)
              onClose()
            }}
          >
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-normal">{t.editTitle(item.name[locale])}</DialogTitle>
              <DialogDescription>{t.editHint}</DialogDescription>
            </DialogHeader>
            <Field data-invalid={error}>
              <FieldLabel htmlFor="listing-price">{t.priceLabel}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>฿</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="listing-price"
                  inputMode="numeric"
                  autoComplete="off"
                  value={text}
                  aria-invalid={error}
                  onChange={(event) => {
                    setText(event.target.value)
                    setError(false)
                  }}
                />
              </InputGroup>
              {error ? <FieldError>{t.priceError}</FieldError> : <FieldDescription>{t.currentPrice(formatBaht(item.price))}</FieldDescription>}
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit">{t.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  )
}
