"use client"

import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TagIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { applyPromoCode, promoCodes, type PromoResult } from "../../lib/pricing"
import { createGuestDetailsSchema, type GuestDetails } from "../../lib/schema"
import type { ISODate } from "../../lib/time"
import { useBookingDraft } from "../../store/booking-draft-store"

export const DETAILS_FORM_ID = "guest-details-form"

export function DetailsStep({ subtotal, date, onComplete }: { subtotal: number; date: ISODate | null; onComplete: () => void }) {
  const { locale, t } = useSpaI18n()
  const { guest, setGuest } = useBookingDraft()
  const schema = useMemo(() => createGuestDetailsSchema(t.validation), [t])
  const form = useForm<GuestDetails>({
    resolver: zodResolver(schema),
    defaultValues: guest,
    mode: "onTouched",
  })

  const onSubmit = form.handleSubmit((values) => {
    setGuest({ ...values, notes: values.notes ?? "" })
    onComplete()
  })

  return (
    <div className="flex flex-col gap-10">
      <form id={DETAILS_FORM_ID} onSubmit={onSubmit} noValidate lang={locale}>
        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{t.details.title}</FieldLegend>
          <FieldDescription>{t.details.hint}</FieldDescription>
          <FieldGroup className="mt-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="guest-name">{t.details.name}</FieldLabel>
                  <Input
                    {...field}
                    id="guest-name"
                    autoComplete="name"
                    placeholder={t.details.namePlaceholder}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="guest-email">{t.details.email}</FieldLabel>
                    <Input
                      {...field}
                      id="guest-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="name@example.com…"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="guest-phone">{t.details.mobile}</FieldLabel>
                    <Input
                      {...field}
                      id="guest-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="081 234 5678…"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="guest-notes">{t.details.notes}</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id="guest-notes"
                    rows={3}
                    autoComplete="off"
                    placeholder={t.details.notesPlaceholder}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{t.details.optional}</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="acceptPolicy"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Checkbox
                    id="guest-policy"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="guest-policy" className="font-normal">
                      {t.details.policy}
                    </FieldLabel>
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </form>

      <PromoCodeField subtotal={subtotal} date={date} />
    </div>
  )
}

function PromoCodeField({ subtotal, date }: { subtotal: number; date: ISODate | null }) {
  const { t } = useSpaI18n()
  const { promoCode, setPromoCode } = useBookingDraft()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const applied = promoCode ? applyPromoCode(promoCode, { subtotal, date: date ?? undefined }) : null
  const describe = (result: Extract<PromoResult, { ok: false }>) => t.promo.errors[result.reason](result.code)

  function apply() {
    if (!value.trim()) {
      setError(t.promo.enterFirst)
      return
    }
    const result = applyPromoCode(value, { subtotal, date: date ?? undefined })
    if (result.ok) {
      setPromoCode(result.code)
      setValue("")
      setError(null)
    } else {
      setError(describe(result))
    }
  }

  return (
    <FieldSet>
      <FieldLegend className="font-heading text-xl font-normal">{t.promo.title}</FieldLegend>
      {applied?.ok ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-celadon bg-secondary px-3 py-2 text-sm" role="status">
          <span className="flex items-center gap-2">
            <TagIcon className="size-4 text-celadon-deep dark:text-celadon" aria-hidden="true" />
            <span>{t.promo.applied(applied.code, t.promo.labels[applied.code] ?? "")}</span>
          </span>
          <Button variant="ghost" size="icon-sm" aria-label={t.promo.remove(applied.code)} onClick={() => setPromoCode(null)}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="promo-code" className="sr-only">
            {t.promo.title}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="promo-code"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  apply()
                }
              }}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="characters"
              placeholder="WELCOME10…"
              aria-invalid={!!error}
              aria-describedby="promo-help"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={apply}>{t.promo.apply}</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldDescription id="promo-help">{t.promo.try(promoCodes.map((promo) => promo.code).join(", "))}</FieldDescription>
          )}
        </Field>
      )}
      {applied && !applied.ok && (
        <p className="text-sm text-destructive" role="alert">
          {describe(applied)} {t.promo.notApplied}
        </p>
      )}
    </FieldSet>
  )
}
