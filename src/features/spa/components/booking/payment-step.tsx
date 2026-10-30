"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { GiftIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { spa } from "../../data/spa"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import type { Quote } from "../../lib/pricing"
import { buildPromptPayPayload } from "../../lib/promptpay"
import { formatLongDate, type ISODate } from "../../lib/time"
import { checkVoucher, type VoucherCheck, type VoucherSplit } from "../../lib/vouchers"
import { useBookingDraft, type PaymentChoice } from "../../store/booking-draft-store"
import { useVouchersStore } from "../../store/vouchers-store"

export function PaymentStep({ quote, today, voucher, split }: { quote: Quote; today: ISODate; voucher: VoucherCheck | null; split: VoucherSplit | null }) {
  const { t } = useSpaI18n()
  const { payment, setPayment } = useBookingDraft()
  const applied = split?.applied ?? 0
  const deposit = Math.max(0, quote.deposit - applied)
  const atSpa = quote.total - applied

  return (
    <div className="flex flex-col gap-8">
      <VoucherField today={today} voucher={voucher} applied={applied} />

      {applied > 0 && deposit === 0 ? (
        <p className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm" role="status" data-testid="voucher-covers">
          <GiftIcon className="mt-0.5 size-4 shrink-0 text-celadon-deep dark:text-celadon" aria-hidden="true" />
          {applied >= quote.total ? t.payment.coversAll : t.payment.coversDeposit(formatBaht(atSpa))}
        </p>
      ) : (
        <>
          <FieldSet>
            <FieldLegend className="font-heading text-2xl font-normal">{t.payment.title}</FieldLegend>
            <RadioGroup value={payment} onValueChange={(value) => setPayment(value as PaymentChoice)} className="gap-3">
              <FieldLabel htmlFor="pay-promptpay">
                <Field orientation="horizontal">
                  <RadioGroupItem value="promptpay" id="pay-promptpay" />
                  <FieldContent>
                    <FieldTitle>{t.payment.deposit(formatBaht(deposit))}</FieldTitle>
                    <FieldDescription>{t.payment.depositHint(formatBaht(atSpa - deposit))}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="pay-at-spa">
                <Field orientation="horizontal">
                  <RadioGroupItem value="pay-at-spa" id="pay-at-spa" />
                  <FieldContent>
                    <FieldTitle>{t.payment.atSpa(formatBaht(atSpa))}</FieldTitle>
                    <FieldDescription>{t.payment.atSpaHint}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </RadioGroup>
          </FieldSet>

          {payment === "promptpay" && <PromptPayPanel amount={deposit} testId="deposit-amount" />}
        </>
      )}
    </div>
  )
}

/** Code entry for a gift voucher, or the applied voucher with what's left on it. */
function VoucherField({ today, voucher, applied }: { today: ISODate; voucher: VoucherCheck | null; applied: number }) {
  const { locale, t } = useSpaI18n()
  const v = t.voucher
  const setVoucherCode = useBookingDraft((state) => state.setVoucherCode)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const describe = (result: Extract<VoucherCheck, { ok: false }>) =>
    result.reason === "expired" ? v.errors.expired(result.code, formatLongDate(result.validUntil!, locale)) : v.errors[result.reason](result.code)

  function apply() {
    if (!value.trim()) return setError(v.enterFirst)
    const { issued, redemptions } = useVouchersStore.getState()
    const result = checkVoucher(value, issued, redemptions, today)
    if (!result.ok) return setError(describe(result))
    setVoucherCode(result.voucher.code)
    setValue("")
    setError(null)
  }

  return (
    <FieldSet>
      <FieldLegend className="font-heading text-xl font-normal">{v.title}</FieldLegend>
      {voucher?.ok ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-celadon bg-secondary px-3 py-2 text-sm" role="status" data-testid="voucher-applied">
          <span className="flex items-start gap-2">
            <GiftIcon className="mt-0.5 size-4 shrink-0 text-celadon-deep dark:text-celadon" aria-hidden="true" />
            <span>
              {v.applied(voucher.voucher.code, formatBaht(applied))}
              {voucher.balance > applied && <span className="block text-muted-foreground">{v.left(formatBaht(voucher.balance - applied))}</span>}
            </span>
          </span>
          <Button variant="ghost" size="icon-sm" aria-label={v.remove(voucher.voucher.code)} onClick={() => setVoucherCode(null)}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="voucher-code" className="sr-only">
            {v.title}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="voucher-code"
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
              placeholder="BLG-XXXX-XXXX…"
              aria-invalid={!!error}
              aria-describedby="voucher-help"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={apply}>{v.apply}</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error ? <FieldError>{error}</FieldError> : <FieldDescription id="voucher-help">{v.hint}</FieldDescription>}
        </Field>
      )}
      {voucher && !voucher.ok && (
        <p className="text-sm text-destructive" role="alert">
          {describe(voucher)}
        </p>
      )}
    </FieldSet>
  )
}

/** QR, amount and payee for a PromptPay transfer to the spa. */
export function PromptPayPanel({ amount, testId }: { amount: number; testId?: string }) {
  const { locale, t } = useSpaI18n()
  const payload = buildPromptPayPayload(spa.promptPayId, amount)
  return (
    <section
      aria-labelledby="qr-title"
      className="grid gap-6 rounded-lg border border-border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center"
    >
      <div className="mx-auto flex flex-col items-center gap-2 rounded-md bg-white p-3 ring-1 ring-border">
        <span className="rounded-sm bg-[#113566] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white" translate="no">
          PromptPay
        </span>
        <QRCodeSVG value={payload} size={176} level="M" title={t.payment.qrTitle(formatBaht(amount))} />
      </div>
      <div className="flex flex-col gap-3">
        <h3 id="qr-title" className="font-heading text-xl">
          {t.payment.scan}
        </h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t.payment.amount}</dt>
          <dd className="font-medium tabular-nums" data-testid={testId}>
            {formatBaht(amount)}
          </dd>
          <dt className="text-muted-foreground">{t.payment.payTo}</dt>
          <dd>{spa.fullName[locale]}</dd>
        </dl>
      </div>
    </section>
  )
}
