"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ShoppingBagIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { isValidPhone } from "@/lib/phone"
import { ProvincePicker } from "@/components/province-picker"
import { getProvince, postcodeMatchesProvince } from "@/lib/thailand"
import { shopMessages, type ShopMessages } from "../../i18n/messages"
import { cartLines, stockShortages } from "../../lib/cart"
import {
  applyShopPromo,
  CARRIERS,
  carrierInfo,
  cardBrand,
  cardDigits,
  cvcValid,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  isTestCard,
  luhnValid,
  orderReference,
  orderTotals,
  type Carrier,
} from "../../lib/checkout"
import { formatBaht } from "../../lib/format"
import { useLiveProducts } from "../../hooks/use-live-products"
import { useCartStore } from "../../store/cart-store"
import { useOrdersStore } from "../../store/orders-store"
import { PromoField } from "../cart/promo-field"
import { CoffeeBag } from "../coffee-bag"

/** Simulated payment processing time. */
const PROCESSING_MS = 900

function createSchema(t: ShopMessages["checkout"], locale: Locale) {
  return z
    .object({
      name: z.string().trim().min(2, t.errors.name),
      email: z.string().trim().pipe(z.email(t.errors.email)),
      phone: z.string().trim().refine(isValidPhone, t.errors.phone),
      line1: z.string().trim().min(3, t.errors.line1),
      line2: z.string().trim().min(2, t.errors.line2),
      district: z.string().trim().min(2, t.errors.district),
      provinceId: z.string().min(1, t.errors.province),
      postcode: z.string().trim().regex(/^\d{5}$/, t.errors.postcode),
      carrier: z.enum(CARRIERS),
      method: z.enum(["promptpay", "card"]),
      cardNumber: z.string(),
      cardName: z.string(),
      expiry: z.string(),
      cvc: z.string(),
    })
    .superRefine((values, ctx) => {
      const province = getProvince(values.provinceId)
      if (province && /^\d{5}$/.test(values.postcode) && !postcodeMatchesProvince(values.postcode, values.provinceId)) {
        ctx.addIssue({ code: "custom", path: ["postcode"], message: t.errors.postcodeProvince(province.name[locale], province.postalPrefix) })
      }
      if (values.method !== "card") return
      if (!luhnValid(values.cardNumber)) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: t.errors.cardNumber })
      else if (!isTestCard(values.cardNumber)) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: t.errors.cardTest })
      if (values.cardName.trim().length < 2) ctx.addIssue({ code: "custom", path: ["cardName"], message: t.errors.cardName })
      if (!expiryValid(values.expiry, new Date())) ctx.addIssue({ code: "custom", path: ["expiry"], message: t.errors.expiry })
      if (!cvcValid(values.cvc, cardBrand(values.cardNumber))) ctx.addIssue({ code: "custom", path: ["cvc"], message: t.errors.cvc })
    })
}

type CheckoutValues = z.infer<ReturnType<typeof createSchema>>

const defaults: CheckoutValues = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  district: "",
  provinceId: "",
  postcode: "",
  carrier: "kerry",
  method: "promptpay",
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvc: "",
}

export function Checkout() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const router = useRouter()
  const hydrated = usePersistHydrated(useCartStore.persist)
  usePersistHydrated(useOrdersStore.persist)
  const items = useCartStore((state) => state.items)
  const promoCode = useCartStore((state) => state.promoCode)
  const clearCart = useCartStore((state) => state.clear)
  const addOrder = useOrdersStore((state) => state.add)
  const [placing, setPlacing] = useState(false)

  const schema = useMemo(() => createSchema(t.checkout, locale), [t, locale])
  const form = useForm<CheckoutValues>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" })
  const [carrier, method] = useWatch({ control: form.control, name: ["carrier", "method"] })

  const live = useLiveProducts()
  const fitCart = useCartStore((state) => state.fitToStock)
  const lines = hydrated ? cartLines(items) : []
  // Stock can drop while someone is checking out (another order, a stocktake): never take payment for bags we don't have.
  const shortages = hydrated && !placing ? stockShortages(items, live) : []
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const promo = promoCode ? applyShopPromo(promoCode, subtotal) : null
  const totals = orderTotals(lines, { promo, carrier })

  if (!hydrated) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem]" aria-busy="true">
        <Skeleton className="h-[32rem]" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (lines.length === 0 && !placing) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBagIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.checkout.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.checkout.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={localePath(locale, "/shop/coffee")}>{t.cart.browse}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (stockShortages(useCartStore.getState().items, live).length) {
      document.getElementById("stock-shortage")?.focus()
      return
    }
    setPlacing(true)
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS))
    const now = new Date()
    const reference = orderReference(now, now.getTime())
    const digits = cardDigits(values.cardNumber)
    addOrder({
      reference,
      createdAt: now.toISOString(),
      lines: lines.map((line) => ({
        productId: line.productId,
        name: line.product.name,
        kind: line.product.kind,
        amount: line.amount,
        grind: line.grind,
        quantity: line.quantity,
        unitPrice: line.size.price,
      })),
      totals,
      promoCode: promo?.ok ? promo.code : null,
      contact: { name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() },
      address: {
        line1: values.line1.trim(),
        line2: values.line2.trim(),
        district: values.district.trim(),
        provinceId: values.provinceId,
        postcode: values.postcode,
      },
      carrier: values.carrier,
      // Never keep the full card number: brand and last four only.
      payment: values.method === "card" ? { method: "card", brand: cardBrand(digits), last4: digits.slice(-4) } : { method: "promptpay" },
      paidAt: values.method === "card" ? now.toISOString() : null,
    })
    // Clear first, then navigate: updating the cart mid-navigation makes React warn about flushSync.
    // `placing` stays true, so the empty-cart state never flashes.
    clearCart()
    router.push(localePath(locale, `/shop/order?ref=${reference}`))
  })

  const text = (name: keyof CheckoutValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
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

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-14">
      <div className="flex min-w-0 flex-col gap-10">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">{t.checkout.title}</h1>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-bold">{t.checkout.contact}</FieldLegend>
          <FieldGroup>
            {text("name", t.checkout.name, { autoComplete: "name" })}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("email", t.checkout.email, { type: "email", inputMode: "email", autoComplete: "email", spellCheck: false })}
              {text("phone", t.checkout.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "081 234 5678…" })}
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-bold">{t.checkout.address}</FieldLegend>
          <FieldGroup>
            {text("line1", t.checkout.line1, { autoComplete: "address-line1", placeholder: t.checkout.line1Placeholder })}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("line2", t.checkout.line2, { autoComplete: "address-line2", placeholder: t.checkout.line2Placeholder })}
              {text("district", t.checkout.district, { autoComplete: "address-level3", placeholder: t.checkout.districtPlaceholder })}
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
              {text("postcode", t.checkout.postcode, { inputMode: "numeric", autoComplete: "postal-code", maxLength: 5, placeholder: "50200…" })}
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-bold">{t.checkout.shipping}</FieldLegend>
          <Controller
            name="carrier"
            control={form.control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={(value) => field.onChange(value as Carrier)} className="gap-3">
                {CARRIERS.map((option) => {
                  const info = carrierInfo[option]
                  const fee = totals.subtotal >= 1000 || (promo?.ok && promo.freeShipping) ? 0 : info.fee
                  return (
                    <FieldLabel key={option} htmlFor={`carrier-${option}`}>
                      <Field orientation="horizontal" className="items-center">
                        <RadioGroupItem value={option} id={`carrier-${option}`} />
                        <FieldContent>
                          <FieldTitle>{t.checkout.carriers[option]}</FieldTitle>
                          <FieldDescription>{t.checkout.days(info.days[0], info.days[1])}</FieldDescription>
                        </FieldContent>
                        <span className="text-sm font-medium tabular-nums">{fee === 0 ? t.checkout.free : formatBaht(fee)}</span>
                      </Field>
                    </FieldLabel>
                  )
                })}
              </RadioGroup>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-xl font-bold">{t.checkout.payment}</FieldLegend>
          <Controller
            name="method"
            control={form.control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                <FieldLabel htmlFor="pay-promptpay">
                  <Field orientation="horizontal">
                    <RadioGroupItem value="promptpay" id="pay-promptpay" />
                    <FieldContent>
                      <FieldTitle>{t.checkout.promptpay}</FieldTitle>
                      <FieldDescription>{t.checkout.promptpayHint}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="pay-card">
                  <Field orientation="horizontal">
                    <RadioGroupItem value="card" id="pay-card" />
                    <FieldContent>
                      <FieldTitle>{t.checkout.card}</FieldTitle>
                      <FieldDescription>{t.checkout.cardHint}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </RadioGroup>
            )}
          />
          {method === "card" && (
            <FieldGroup className="rounded-md border border-border p-4">
              <Controller
                name="cardNumber"
                control={form.control}
                render={({ field, fieldState }) => {
                  const brand = cardBrand(field.value)
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="checkout-cardNumber">{t.checkout.cardNumber}</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          onChange={(event) => field.onChange(formatCardNumber(event.target.value))}
                          id="checkout-cardNumber"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="4242 4242 4242 4242…"
                          aria-invalid={fieldState.invalid}
                          className="pr-28 tabular-nums"
                        />
                        {brand !== "unknown" && (
                          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                            {t.checkout.brands[brand]}
                          </span>
                        )}
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )
                }}
              />
              {text("cardName", t.checkout.cardName, { autoComplete: "cc-name" })}
              <div className="grid grid-cols-2 gap-5">
                <Controller
                  name="expiry"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="checkout-expiry">{t.checkout.expiry}</FieldLabel>
                      <Input
                        {...field}
                        onChange={(event) => field.onChange(formatExpiry(event.target.value))}
                        id="checkout-expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="12/28…"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                {text("cvc", t.checkout.cvc, { inputMode: "numeric", autoComplete: "cc-csc", maxLength: 4, placeholder: "123…" })}
              </div>
            </FieldGroup>
          )}
        </FieldSet>
      </div>

      <aside className="flex flex-col gap-5 self-start rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-heading text-xl font-bold">{t.checkout.summary}</h2>
        {shortages.length > 0 && (
          <div
            id="stock-shortage"
            tabIndex={-1}
            role="alert"
            data-testid="stock-shortage"
            className="flex flex-col gap-3 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlertIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {t.checkout.shortage.title}
            </p>
            <p className="text-muted-foreground">{t.checkout.shortage.body}</p>
            <ul className="flex flex-col gap-1">
              {shortages.map((shortage) => (
                <li key={shortage.key}>{t.checkout.shortage.line(shortage.product.name, t.detail.sizeLabel(shortage.amount, shortage.product.kind), shortage.wanted, shortage.left)}</li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => {
                fitCart(live)
                toast.success(t.checkout.shortage.fixed)
              }}
            >
              {t.checkout.shortage.fix}
            </Button>
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <li key={line.key} className="flex items-center gap-3 text-sm">
              <div className="w-10 shrink-0">
                <CoffeeBag product={line.product} locale={locale} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {line.product.name} × {line.quantity}
                </p>
                <p className="text-muted-foreground">
                  {t.detail.sizeLabel(line.amount, line.product.kind)}
                  {line.grind ? `, ${t.detail.grinds[line.grind]}` : ""}
                </p>
              </div>
              <span className="tabular-nums">{formatBaht(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <PromoField subtotal={totals.subtotal} id="checkout-promo" />
        <dl className="grid grid-cols-2 gap-y-1 border-t border-border pt-4 text-sm">
          <dt className="text-muted-foreground">{t.cart.subtotal}</dt>
          <dd className="text-right tabular-nums">{formatBaht(totals.subtotal)}</dd>
          {totals.discount > 0 && promoCode && (
            <>
              <dt className="text-leaf">{t.cart.discount(promoCode)}</dt>
              <dd className="text-right text-leaf tabular-nums">−{formatBaht(totals.discount)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t.cart.shipping}</dt>
          <dd className="text-right tabular-nums">{totals.shipping === 0 ? t.cart.free : formatBaht(totals.shipping)}</dd>
          <dt className="pt-2 font-medium">{t.cart.total}</dt>
          <dd className="pt-2 text-right font-heading text-2xl font-extrabold tabular-nums" data-testid="checkout-total">
            {formatBaht(totals.total)}
          </dd>
        </dl>
        <Button type="submit" size="xl" disabled={placing || shortages.length > 0}>
          {placing && <Spinner data-icon="inline-start" />}
          {placing ? t.checkout.placing : t.checkout.place(formatBaht(totals.total))}
        </Button>
      </aside>
    </form>
  )
}
