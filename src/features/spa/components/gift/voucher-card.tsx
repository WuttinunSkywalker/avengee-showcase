"use client"

import { cn } from "@/lib/utils"
import { spa } from "../../data/spa"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import type { Locale } from "@/i18n/config"
import { formatDayMonth, type ISODate } from "../../lib/time"
import type { VoucherDesign } from "../../lib/vouchers"

/**
 * Card artwork, like a printed card: it keeps its colours in dark mode and on
 * paper. Teak is the house's wood, indigo its cotton, jasmine the garlands at the door.
 */
export const voucherArtwork: Record<VoucherDesign, { paper: string; ink: string; line: string }> = {
  teak: { paper: "#6b4a30", ink: "#f6ecdc", line: "#d8b88a" },
  indigo: { paper: "#1f2c58", ink: "#f2eee3", line: "#a3b4d8" },
  jasmine: { paper: "#f6f0e1", ink: "#23305c", line: "#b7a272" },
}

/** "4 Nov 2027" / "4 พ.ย. 2570": short enough to sit on the card. */
function cardDate(date: ISODate, locale: Locale) {
  return `${formatDayMonth(date, locale)} ${Number(date.slice(0, 4)) + (locale === "th" ? 543 : 0)}`
}

interface VoucherCardProps {
  design: VoucherDesign
  amount: number
  to: string
  from: string
  message: string
  /** Issued vouchers show their code and expiry; the preview shows placeholders. */
  code?: string
  validUntil?: ISODate
  className?: string
}

export function VoucherCard({ design, amount, to, from, message, code, validUntil, className }: VoucherCardProps) {
  const { locale, t } = useSpaI18n()
  const c = t.gift.card
  const art = voucherArtwork[design]

  return (
    <div
      className={cn("@container relative w-full overflow-hidden rounded-xl shadow-[0_18px_40px_-24px_rgb(20_24_40/0.55)] print:shadow-none", className)}
      style={{ backgroundColor: art.paper, color: art.ink }}
      data-testid="voucher-card"
      data-design={design}
    >
      {/* The arched window of the teak house, as a thin frame on the right */}
      <svg aria-hidden="true" viewBox="0 0 100 160" className="absolute top-[14%] right-[6%] h-[72%] opacity-60" fill="none" stroke={art.line} strokeWidth="1.2">
        <path d="M6 156V60a44 44 0 0 1 88 0v96Z" />
        <path d="M16 156V62a34 34 0 0 1 68 0v94" />
        <path d="M50 28v128M16 92h68" />
      </svg>
      <div className="absolute inset-[3.2cqw] rounded-lg border" style={{ borderColor: `${art.line}80` }} />

      {/* At least 7:4 like a printed card, taller when a phone-sized card needs room for the message */}
      <div className="relative flex min-h-[57.14cqw] flex-col justify-between gap-[3cqw] p-[7cqw] pr-[33cqw]">
        <div className="flex items-baseline gap-[2cqw]">
          <span className="font-heading text-[max(1rem,4.6cqw)] leading-none" translate="no">
            {spa.name[locale]}
          </span>
          <span className="text-[max(0.7rem,2.6cqw)] opacity-80">{c.label}</span>
        </div>

        <div className="flex min-w-0 flex-col gap-[1.6cqw]">
          <p className="font-heading text-[11cqw] leading-none tabular-nums" data-testid="voucher-amount">
            {formatBaht(amount)}
          </p>
          <p className="truncate text-[max(0.8rem,3.4cqw)] font-medium">{to.trim() ? c.for(to.trim()) : c.anyTreatment}</p>
          {message.trim() && <p className="line-clamp-2 text-[max(0.72rem,2.9cqw)] leading-snug opacity-90">{message.trim()}</p>}
          {from.trim() && <p className="truncate text-[max(0.72rem,2.9cqw)] opacity-80">{c.from(from.trim())}</p>}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-[3cqw] text-[max(0.68rem,2.5cqw)] opacity-85">
          <span className="font-medium tracking-[0.08em] tabular-nums" data-testid="voucher-code" translate="no">
            {code ?? "BLG-····-····"}
          </span>
          <span>{validUntil ? c.validUntil(cardDate(validUntil, locale)) : c.validFor}</span>
        </div>
      </div>
    </div>
  )
}
