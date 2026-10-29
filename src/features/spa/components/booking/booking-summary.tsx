"use client"

import { getAddOn, getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import type { BookingDraft } from "../../store/booking-draft-store"
import { formatBaht, formatBahtPrecise } from "../../lib/format"
import type { Quote } from "../../lib/pricing"
import { formatDuration, formatLongDate, formatTimeRange } from "../../lib/time"

export function BookingSummary({ draft, quote }: { draft: BookingDraft; quote: Quote | null }) {
  const { locale, t } = useSpaI18n()
  const service = draft.serviceId ? getService(draft.serviceId) : undefined
  const therapist = draft.therapist !== "any" ? getTherapist(draft.therapist) : undefined

  return (
    <section aria-labelledby="summary-title" className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
      <h2 id="summary-title" className="font-heading text-xl">
        {t.summary.title}
      </h2>

      {!service || !quote ? (
        <p className="text-sm text-muted-foreground">{t.summary.empty}</p>
      ) : (
        <>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="min-w-0">
                {service.name[locale]}
                <span className="block text-muted-foreground">{formatDuration(draft.minutes ?? 0, locale)}</span>
              </dt>
              <dd className="tabular-nums">{formatBaht(quote.basePrice)}</dd>
            </div>
            {draft.addOnIds.map((id) => {
              const addOn = getAddOn(id)
              if (!addOn) return null
              return (
                <div key={id} className="flex justify-between gap-4">
                  <dt>{addOn.name[locale]}</dt>
                  <dd className="tabular-nums">{formatBaht(addOn.price)}</dd>
                </div>
              )
            })}
            {quote.discount > 0 && quote.promo?.ok && (
              <div className="flex justify-between gap-4 text-celadon-deep dark:text-celadon">
                <dt>{t.summary.code(quote.promo.code)}</dt>
                <dd className="tabular-nums">−{formatBaht(quote.discount)}</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium">{t.summary.total}</span>
              <span className="font-heading text-2xl tabular-nums" data-testid="summary-total">
                {formatBaht(quote.total)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">{t.summary.vat(formatBahtPrecise(quote.vat))}</p>
          </div>

          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.summary.therapist}</dt>
              <dd className="text-right">{therapist ? t.team.call(therapist.name[locale]) : t.summary.firstAvailable}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t.summary.when}</dt>
              <dd className="text-right tabular-nums">
                {draft.date && draft.start !== null ? (
                  <>
                    {formatLongDate(draft.date, locale)}
                    <br />
                    {formatTimeRange(draft.start, quote.duration)}
                  </>
                ) : (
                  t.summary.notChosen
                )}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
