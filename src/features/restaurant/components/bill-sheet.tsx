"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeftIcon, MinusIcon, PlusIcon, QrCodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Locale } from "@/i18n/config"
import { formatBaht } from "@/lib/format"
import { buildPromptPayPayload } from "@/lib/promptpay"
import { getDish, restaurant } from "../data/menu"
import { restaurantMessages } from "../i18n/messages"
import { billUnits, MAX_PEOPLE, MIN_PEOPLE, roundsTotal, splitByItems, splitEvenly, type Round } from "../lib/order"

type Mode = "even" | "items"

/**
 * Splitting the table's bill: evenly, or plate by plate. Each person gets
 * their amount and a PromptPay QR for exactly that; the QRs only appear once
 * every plate has someone paying for it.
 */
export function BillSheet({ rounds, locale, open, onOpenChange }: { rounds: Round[]; locale: Locale; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = restaurantMessages[locale].bill
  const [mode, setMode] = useState<Mode>("even")
  const [people, setPeople] = useState(2)
  const [assignments, setAssignments] = useState<Record<string, number[]>>({})
  const [qr, setQr] = useState<number | null>(null)
  const total = roundsTotal(rounds)
  const units = billUnits(rounds)
  const byItems = splitByItems(units, assignments, people)
  const amounts = mode === "even" ? splitEvenly(total, people) : byItems.perPerson
  const ready = mode === "even" || byItems.unassigned === 0

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQr(null)
      }}
    >
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg" data-testid="bill-sheet">
        {qr !== null ? (
          <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-8 text-center">
            <DrawerTitle className="font-heading text-2xl font-semibold">{t.qrTitle(qr + 1, formatBaht(amounts[qr]))}</DrawerTitle>
            <div className="rounded-[var(--radius)] bg-white p-4" data-testid="bill-qr">
              <QRCodeSVG value={buildPromptPayPayload(restaurant.promptPayId, amounts[qr])} size={200} level="M" title={t.qrTitle(qr + 1, formatBaht(amounts[qr]))} />
            </div>
            <DrawerDescription>{t.qrHint}</DrawerDescription>
            <Button variant="outline" onClick={() => setQr(null)}>
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              {t.title}
            </Button>
          </div>
        ) : (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-heading text-2xl font-semibold">{t.title}</DrawerTitle>
              <DrawerDescription>{t.description(formatBaht(total))}</DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-5 overflow-y-auto overscroll-contain px-4 pb-4">
              <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(value) => value && setMode(value as Mode)} aria-label={t.modesLabel} className="justify-start">
                <ToggleGroupItem value="even" className="px-3">
                  {t.modes.even}
                </ToggleGroupItem>
                <ToggleGroupItem value="items" className="px-3">
                  {t.modes.items}
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="flex items-center justify-between gap-3">
                <span className="font-heading font-medium">{t.people}</span>
                <div className="flex items-center rounded-[calc(var(--radius)-0.25rem)] border border-input" role="group" aria-label={t.people}>
                  <Button variant="ghost" size="icon-lg" aria-label={t.fewer} disabled={people <= MIN_PEOPLE} onClick={() => setPeople((n) => n - 1)}>
                    <MinusIcon aria-hidden="true" />
                  </Button>
                  <output className="w-8 text-center font-heading font-medium tabular-nums" data-testid="bill-people">
                    {people}
                  </output>
                  <Button variant="ghost" size="icon-lg" aria-label={t.more} disabled={people >= MAX_PEOPLE} onClick={() => setPeople((n) => n + 1)}>
                    <PlusIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {mode === "items" && (
                <section className="flex flex-col gap-2" aria-labelledby="bill-who">
                  <div>
                    <h3 id="bill-who" className="font-heading font-medium">
                      {t.whoHad}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.whoHadHint}</p>
                  </div>
                  <ul className="flex flex-col divide-y divide-border rounded-[calc(var(--radius)-0.25rem)] border border-border">
                    {units.map((unit) => {
                      const name = getDish(unit.dishId)?.name[locale] ?? unit.dishId
                      return (
                        <li key={unit.id} className="flex flex-col gap-2 px-3 py-2.5" data-testid="bill-unit">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium">
                              {name}
                              {unit.of > 1 && <span className="font-normal text-muted-foreground"> ({t.portion(unit.portion, unit.of)})</span>}
                            </span>
                            <span className="text-sm tabular-nums">{formatBaht(unit.price)}</span>
                          </div>
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            size="sm"
                            value={(assignments[unit.id] ?? []).filter((p) => p < people).map(String)}
                            onValueChange={(value) => setAssignments((current) => ({ ...current, [unit.id]: value.map(Number).sort((a, b) => a - b) }))}
                            aria-label={t.sharedBy(name)}
                            className="flex-wrap justify-start"
                          >
                            {Array.from({ length: people }, (_, person) => (
                              <ToggleGroupItem key={person} value={String(person)} aria-label={t.person(person + 1)} className="min-w-9 px-2 tabular-nums">
                                {person + 1}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </li>
                      )
                    })}
                  </ul>
                  <p className={byItems.unassigned ? "text-sm font-medium text-chili" : "text-sm text-primary"} aria-live="polite" data-testid="bill-unassigned">
                    {byItems.unassigned ? t.unassigned(formatBaht(byItems.unassigned)) : t.allAssigned}
                  </p>
                </section>
              )}
            </div>
            <DrawerFooter className="border-t border-border">
              <ul className="flex flex-col gap-2" data-testid="bill-people-list">
                {amounts.map((amount, person) => (
                  <li key={person} className="flex items-center justify-between gap-3">
                    <span>
                      <span className="font-heading font-medium">{t.person(person + 1)}</span> <span className="text-muted-foreground">{t.pays(formatBaht(amount))}</span>
                    </span>
                    <Button variant="outline" size="sm" disabled={!ready || amount === 0} onClick={() => setQr(person)} aria-label={t.showQr(person + 1)}>
                      <QrCodeIcon data-icon="inline-start" aria-hidden="true" />
                      QR
                    </Button>
                  </li>
                ))}
              </ul>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
