"use client"

import { QRCodeSVG } from "qrcode.react"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { spa } from "../../data/spa"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import type { Quote } from "../../lib/pricing"
import { buildPromptPayPayload } from "../../lib/promptpay"
import { useBookingDraft, type PaymentChoice } from "../../store/booking-draft-store"

export function PaymentStep({ quote }: { quote: Quote }) {
  const { locale, t } = useSpaI18n()
  const { payment, setPayment } = useBookingDraft()
  const payload = buildPromptPayPayload(spa.promptPayId, quote.deposit)

  return (
    <div className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend className="font-heading text-2xl font-normal">{t.payment.title}</FieldLegend>
        <RadioGroup value={payment} onValueChange={(value) => setPayment(value as PaymentChoice)} className="gap-3">
          <FieldLabel htmlFor="pay-promptpay">
            <Field orientation="horizontal">
              <RadioGroupItem value="promptpay" id="pay-promptpay" />
              <FieldContent>
                <FieldTitle>{t.payment.deposit(formatBaht(quote.deposit))}</FieldTitle>
                <FieldDescription>{t.payment.depositHint(formatBaht(quote.total - quote.deposit))}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="pay-at-spa">
            <Field orientation="horizontal">
              <RadioGroupItem value="pay-at-spa" id="pay-at-spa" />
              <FieldContent>
                <FieldTitle>{t.payment.atSpa(formatBaht(quote.total))}</FieldTitle>
                <FieldDescription>{t.payment.atSpaHint}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>

      {payment === "promptpay" && (
        <section
          aria-labelledby="qr-title"
          className="grid gap-6 rounded-lg border border-border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center"
        >
          <div className="mx-auto flex flex-col items-center gap-2 rounded-md bg-white p-3 ring-1 ring-border">
            <span className="rounded-sm bg-[#113566] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white" translate="no">
              PromptPay
            </span>
            <QRCodeSVG value={payload} size={176} level="M" title={t.payment.qrTitle(formatBaht(quote.deposit))} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 id="qr-title" className="font-heading text-xl">
              {t.payment.scan}
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t.payment.amount}</dt>
              <dd className="font-medium tabular-nums" data-testid="deposit-amount">
                {formatBaht(quote.deposit)}
              </dd>
              <dt className="text-muted-foreground">{t.payment.payTo}</dt>
              <dd>{spa.fullName[locale]}</dd>
            </dl>
          </div>
        </section>
      )}
    </div>
  )
}
