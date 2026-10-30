"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { QRCodeSVG } from "qrcode.react"
import { z } from "zod"
import { ShieldCheckIcon } from "lucide-react"
import { ProvincePicker } from "@/components/province-picker"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatBaht } from "@/lib/format"
import { isValidPhone } from "@/lib/phone"
import { buildPromptPayPayload } from "@/lib/promptpay"
import { getProvince, postcodeMatchesProvince } from "@/lib/thailand"
import { talad } from "../data/sellers"
import { useBasket } from "../hooks/use-basket"
import { marketplaceMessages, type MarketplaceMessages } from "../i18n/messages"
import { bangkokClock, basketTotals, holdEndsAt, placePurchase, type Buyer } from "../lib/basket"
import { useBasketStore, usePurchasesStore } from "../store/basket-store"
import { BasketTotal, DealerGroups } from "./basket-sheet"

function createSchema(t: MarketplaceMessages["checkout"]["errors"], locale: Locale) {
  return z
    .object({
      name: z.string().trim().min(2, t.name),
      email: z.string().trim().pipe(z.email(t.email)),
      phone: z.string().trim().refine(isValidPhone, t.phone),
      line1: z.string().trim().min(3, t.line1),
      line2: z.string().trim().min(2, t.line2),
      district: z.string().trim().min(2, t.district),
      provinceId: z.string().min(1, t.province),
      postcode: z.string().trim().regex(/^\d{5}$/, t.postcode),
    })
    .superRefine((values, ctx) => {
      const province = getProvince(values.provinceId)
      if (province && /^\d{5}$/.test(values.postcode) && !postcodeMatchesProvince(values.postcode, values.provinceId)) {
        ctx.addIssue({ code: "custom", path: ["postcode"], message: t.postcodeProvince(province.name[locale], province.postalPrefix) })
      }
    })
}

const defaults: Buyer = { name: "", email: "", phone: "", line1: "", line2: "", district: "", provinceId: "", postcode: "" }

/**
 * One form, one PromptPay payment, however many dealers are in the basket.
 * Paying turns the basket into an order per dealer.
 */
export function Checkout() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const router = useRouter()
  const { ready, now, lines, groups } = useBasket()
  const clear = useBasketStore((state) => state.clear)
  const addPurchase = usePurchasesStore((state) => state.add)
  const schema = useMemo(() => createSchema(t.checkout.errors, locale), [t, locale])
  const form = useForm<Buyer>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" })
  const [paying, setPaying] = useState<Buyer | null>(null)
  const [placed, setPlaced] = useState(false)
  const totals = basketTotals(groups)

  // Once paid, hold the placeholder while the order page loads rather than flash an empty basket.
  if (!ready || !now || placed) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem]" aria-busy="true">
        <Skeleton className="h-[32rem]" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!groups.length) {
    return (
      <Empty className="mx-auto my-16 max-w-lg">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl font-normal">{t.checkout.emptyTitle}</EmptyTitle>
          <EmptyDescription>{t.checkout.emptyBody}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href={`${localePath(locale, "/marketplace")}#browse`}>{t.basket.browse}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const firstHoldEnds = Math.min(...lines.map(holdEndsAt))

  const text = (name: keyof Buyer, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`checkout-${name}`}>{label}</FieldLabel>
          <Input {...field} id={`checkout-${name}`} aria-invalid={fieldState.invalid} {...props} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  const confirmPaid = () => {
    if (!paying) return
    const purchase = placePurchase(groups, paying, now)
    setPlaced(true)
    addPurchase(purchase)
    clear()
    router.push(localePath(locale, `/marketplace/order?ref=${purchase.reference}`))
  }

  return (
    <form onSubmit={form.handleSubmit(setPaying)} noValidate className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-14">
      <div className="flex min-w-0 flex-col gap-10">
        <h1 className="font-heading text-4xl sm:text-5xl">{t.checkout.title}</h1>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-normal">{t.checkout.contact}</FieldLegend>
          <FieldGroup>
            {text("name", t.checkout.name, { autoComplete: "name" })}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("email", t.checkout.email, { type: "email", inputMode: "email", autoComplete: "email", spellCheck: false })}
              {text("phone", t.checkout.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "081 234 5678…" })}
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-normal">{t.checkout.address}</FieldLegend>
          <FieldGroup>
            {text("line1", t.checkout.line1, { autoComplete: "address-line1" })}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("line2", t.checkout.line2, { autoComplete: "address-line2" })}
              {text("district", t.checkout.district, { autoComplete: "address-level3" })}
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
              <Controller
                name="provinceId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="checkout-province">{t.checkout.province}</FieldLabel>
                    <ProvincePicker
                      id="checkout-province"
                      labels={{ placeholder: t.checkout.provincePlaceholder, search: t.checkout.provinceSearch, empty: t.checkout.provinceEmpty }}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        field.onBlur()
                        if (form.getValues("postcode")) void form.trigger("postcode")
                      }}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              {text("postcode", t.checkout.postcode, { inputMode: "numeric", autoComplete: "postal-code", maxLength: 5, placeholder: "10100…" })}
            </div>
          </FieldGroup>
        </FieldSet>

        <section aria-labelledby="payment-heading" className="flex flex-col gap-3">
          <h2 id="payment-heading" className="font-heading text-xl">
            {t.checkout.payment}
          </h2>
          <p className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-accent/60 p-4 text-sm">
            <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            {t.checkout.escrow}
          </p>
        </section>
      </div>

      <aside className="flex flex-col gap-5 self-start rounded-[var(--radius)] border border-border bg-card p-5 lg:sticky lg:top-24" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="font-heading text-xl">
          {t.checkout.summary}
        </h2>
        <DealerGroups groups={groups} lines={lines} locale={locale} />
        <div className="border-t border-border pt-4">
          <BasketTotal groups={groups} locale={locale} />
        </div>
        <Button type="submit" size="lg">
          {t.checkout.pay(formatBaht(totals.total))}
        </Button>
        <p className="text-sm text-muted-foreground">{t.checkout.holdsUntil(bangkokClock(firstHoldEnds))}</p>
      </aside>

      <Dialog open={paying !== null} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="promptpay-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-normal">{t.checkout.qrTitle(formatBaht(totals.total))}</DialogTitle>
            <DialogDescription>{t.checkout.qrHint}</DialogDescription>
          </DialogHeader>
          <div className="mx-auto rounded-[var(--radius)] bg-white p-4">
            <QRCodeSVG value={buildPromptPayPayload(talad.promptPayId, totals.total)} size={200} level="M" title={t.checkout.qrTitle(formatBaht(totals.total))} />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button size="lg" onClick={confirmPaid}>
              {t.checkout.paid}
            </Button>
            <Button variant="ghost" onClick={() => setPaying(null)}>
              {t.checkout.change}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
