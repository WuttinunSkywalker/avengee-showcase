"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePersistHydrated } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import { formatDuration, toSpaTime } from "../../lib/time"
import {
  createGiftSchema,
  issueVoucher,
  VOUCHER_AMOUNTS,
  VOUCHER_DESIGNS,
  voucherCovers,
  type GiftDetails,
  type VoucherAmount,
  type VoucherDelivery,
  type VoucherDesign,
} from "../../lib/vouchers"
import { useVouchersStore } from "../../store/vouchers-store"
import { PAYMENT_CHECK_MS } from "../booking/booking-wizard"
import { PromptPayPanel } from "../booking/payment-step"
import { voucherArtwork, VoucherCard } from "./voucher-card"

const MESSAGE_MAX = 200

const defaults: GiftDetails = {
  amount: 2000,
  design: "teak",
  to: "",
  from: "",
  message: "",
  buyerEmail: "",
  delivery: "me",
  recipientEmail: "",
}

export function GiftShop() {
  const { locale, t, href } = useSpaI18n()
  const g = t.gift
  const router = useRouter()
  usePersistHydrated(useVouchersStore.persist)
  const schema = useMemo(() => createGiftSchema(g.validation), [g])
  const form = useForm<GiftDetails>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" })
  const values = useWatch({ control: form.control }) as GiftDetails
  const [paying, setPaying] = useState(false)
  const covers = voucherCovers(values.amount)

  const onSubmit = form.handleSubmit(async (details) => {
    setPaying(true)
    await new Promise((resolve) => setTimeout(resolve, PAYMENT_CHECK_MS))
    // Earlier vouchers must be loaded first, or saving this one would overwrite them
    if (!useVouchersStore.persist.hasHydrated()) await useVouchersStore.persist.rehydrate()
    const store = useVouchersStore.getState()
    const instant = new Date()
    const voucher = issueVoucher(details, instant, toSpaTime(instant).date, store.issued.map((issued) => issued.code))
    store.add(voucher)
    router.push(href(`/spa/gift/sent?code=${voucher.code}`))
  })

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-3 lg:col-span-2">
        <h1 className="font-heading text-4xl leading-tight text-balance sm:text-5xl">{g.title}</h1>
        <p className="max-w-[62ch] text-muted-foreground">{g.intro}</p>
      </div>

      <aside aria-label={g.preview} className="lg:sticky lg:top-24 lg:order-2 lg:self-start">
        <VoucherCard design={values.design} amount={values.amount} to={values.to} from={values.from} message={values.message} />
      </aside>

      <form onSubmit={onSubmit} noValidate lang={locale} className="flex flex-col gap-10 lg:order-1" aria-busy={paying}>
        <FieldSet>
          <FieldLegend id="gift-amount" className="font-heading text-2xl font-normal">
            {g.amount}
          </FieldLegend>
          <Controller
            name="amount"
            control={form.control}
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                value={String(field.value)}
                onValueChange={(value) => value && field.onChange(Number(value) as VoucherAmount)}
                aria-labelledby="gift-amount"
                className="flex-wrap justify-start"
              >
                {VOUCHER_AMOUNTS.map((amount) => (
                  <ToggleGroupItem key={amount} value={String(amount)} className="h-11 px-4 tabular-nums">
                    {formatBaht(amount)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
          {covers && (
            <FieldDescription data-testid="gift-covers">
              {g.covers(`${covers.service.name[locale]} ${formatDuration(covers.minutes, locale)}`)}
            </FieldDescription>
          )}
        </FieldSet>

        <FieldSet>
          <FieldLegend id="gift-design" className="font-heading text-2xl font-normal">
            {g.design}
          </FieldLegend>
          <Controller
            name="design"
            control={form.control}
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(value) => value && field.onChange(value as VoucherDesign)}
                aria-labelledby="gift-design"
                className="flex-wrap justify-start"
              >
                {VOUCHER_DESIGNS.map((design) => (
                  <ToggleGroupItem key={design} value={design} className="h-11 gap-2 pr-4 pl-2.5">
                    <span
                      aria-hidden="true"
                      className="size-5 rounded-full ring-1 ring-border"
                      style={{ background: `linear-gradient(135deg, ${voucherArtwork[design].paper} 55%, ${voucherArtwork[design].line} 55%)` }}
                    />
                    {g.designs[design]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{g.forWhom}</FieldLegend>
          <FieldGroup className="mt-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="to"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gift-to">{g.to}</FieldLabel>
                    <Input {...field} id="gift-to" autoComplete="off" placeholder={g.toPlaceholder} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="from"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gift-from">{g.from}</FieldLabel>
                    <Input {...field} id="gift-from" autoComplete="given-name" placeholder={g.fromPlaceholder} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            <Controller
              name="message"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="gift-message">{g.message}</FieldLabel>
                  <Textarea
                    {...field}
                    id="gift-message"
                    rows={3}
                    maxLength={MESSAGE_MAX}
                    autoComplete="off"
                    placeholder={g.messagePlaceholder}
                    aria-invalid={fieldState.invalid}
                    aria-describedby="gift-message-hint"
                  />
                  <FieldDescription id="gift-message-hint">{g.messageHint(MESSAGE_MAX - field.value.length)}</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{g.delivery}</FieldLegend>
          <FieldGroup className="mt-2">
            <Controller
              name="delivery"
              control={form.control}
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={(value) => field.onChange(value as VoucherDelivery)} className="gap-3 sm:grid-cols-2">
                  <FieldLabel htmlFor="gift-to-me">
                    <Field orientation="horizontal">
                      <RadioGroupItem value="me" id="gift-to-me" aria-labelledby="gift-to-me-title" aria-describedby="gift-to-me-hint" />
                      <FieldContent>
                        <FieldTitle id="gift-to-me-title">{g.deliveryMe}</FieldTitle>
                        <FieldDescription id="gift-to-me-hint">{g.deliveryMeHint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="gift-to-them">
                    <Field orientation="horizontal">
                      <RadioGroupItem value="them" id="gift-to-them" aria-labelledby="gift-to-them-title" aria-describedby="gift-to-them-hint" />
                      <FieldContent>
                        <FieldTitle id="gift-to-them-title">{g.deliveryThem(values.to.trim())}</FieldTitle>
                        <FieldDescription id="gift-to-them-hint">{g.deliveryThemHint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="buyerEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gift-buyer-email">{g.yourEmail}</FieldLabel>
                    <Input
                      {...field}
                      id="gift-buyer-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="name@example.com…"
                      aria-invalid={fieldState.invalid}
                    />
                    {values.delivery === "them" && <FieldDescription>{g.yourEmailHint}</FieldDescription>}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              {values.delivery === "them" && (
                <Controller
                  name="recipientEmail"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="gift-recipient-email">{g.recipientEmail}</FieldLabel>
                      <Input
                        {...field}
                        id="gift-recipient-email"
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="name@example.com…"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              )}
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{g.pay}</FieldLegend>
          <PromptPayPanel amount={values.amount} testId="gift-pay-amount" />
        </FieldSet>

        <Button type="submit" size="xl" className="self-start" disabled={paying}>
          {paying ? (
            <>
              <Spinner data-icon="inline-start" />
              {g.checking}
            </>
          ) : (
            g.submit
          )}
        </Button>
      </form>
    </div>
  )
}
