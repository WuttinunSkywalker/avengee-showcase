"use client"

import { useState } from "react"
import { motion, MotionConfig } from "motion/react"
import { XIcon } from "lucide-react"
import { toast } from "sonner"
import { Magnetic } from "@/components/magnetic"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale } from "@/i18n/locale-provider"
import { getScent, type Scent, type ScentId } from "../data/scents"
import { klinMessages } from "../i18n/messages"
import { bottleProfileFor, bottleSilhouette, neckTop } from "../lib/bottle"
import { cleanEngraving, engravingLeft } from "../lib/engraving"
import { formatPrice } from "../lib/story"
import { useBagStore } from "../store/bag-store"

/** Outline, juice level and collar height for each size, so the drawn bottle can morph between them. */
function bottleShape(ml: number) {
  const profile = bottleProfileFor(ml)
  const shoulders = profile.find(([radius, y]) => y > 1 && radius < 0.76)![1]
  return { outline: bottleSilhouette(profile), fill: shoulders * 0.9, neck: neckTop(profile) + 0.08 }
}

const morph = { type: "spring", stiffness: 160, damping: 20 } as const

/** The pop-up for one scent: a drawn bottle in its colours, the notes, a size and the bag button. */
export function ScentSheet({
  scentId,
  onSize,
  onEngrave,
  onClose,
}: {
  scentId: ScentId | null
  onSize?: (ml: number) => void
  /** The engraving as typed so far, so the 3D bottle can show it live. */
  onEngrave?: (text: string) => void
  onClose: () => void
}) {
  const scent = scentId ? getScent(scentId) : undefined
  return (
    <Dialog open={Boolean(scent)} onOpenChange={(open) => !open && onClose()}>
      {scent && <SheetBody key={scent.id} scent={scent} onSize={onSize} onEngrave={onEngrave} onAdded={onClose} />}
    </Dialog>
  )
}

function SheetBody({
  scent,
  onSize,
  onEngrave,
  onAdded,
}: {
  scent: Scent
  onSize?: (ml: number) => void
  onEngrave?: (text: string) => void
  onAdded: () => void
}) {
  const locale = useLocale()
  const t = klinMessages[locale]
  const [ml, setMl] = useState(String(scent.sizes[1].ml))
  const size = scent.sizes.find((option) => String(option.ml) === ml) ?? scent.sizes[1]
  const add = useBagStore((state) => state.add)
  const shape = bottleShape(size.ml)
  const [engraving, setEngraving] = useState("")
  const words = cleanEngraving(engraving)

  return (
    <DialogContent
      showCloseButton={false}
      data-lenis-prevent
      // On wider screens the sheet sits on the left like a configurator, leaving the 3D bottle in view on the right to take the chosen size
      className="max-h-[92svh] gap-0 overflow-y-auto border-border p-0 sm:max-w-lg md:left-[max(1.5rem,calc((100vw-80rem)/2+2rem))] md:max-w-md md:translate-x-0"
      style={{ backgroundColor: scent.backdrop }}
      data-testid="scent-sheet"
    >
      <MotionConfig reducedMotion="user">
        {/* The bottle pops up and settles, its juice filling from the base */}
        <div className="relative flex min-h-56 items-end justify-center overflow-hidden pt-10 md:hidden" style={{ background: `radial-gradient(70% 60% at 50% 62%, ${scent.liquid}55, transparent 70%)` }} aria-hidden="true">
          <motion.svg
            viewBox="-1 -2.8 2 2.85"
            className="h-52 w-auto md:h-80"
            initial={{ y: 60, scale: 0.85, rotate: -6 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.05 }}
            data-testid="sheet-bottle"
            data-ml={size.ml}
          >
            <defs>
              <clipPath id={`juice-${scent.id}`}>
                <motion.rect x="-1" width="2" initial={{ y: 0, height: 0 }} animate={{ y: -shape.fill, height: shape.fill - 0.14 }} transition={morph} />
              </clipPath>
              <linearGradient id={`glass-${scent.id}`} x1="0" x2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
                <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* Outline and juice morph between sizes; every size shares the same points */}
            <motion.path initial={false} animate={{ d: shape.outline }} transition={morph} fill={`url(#glass-${scent.id})`} stroke="#f1ebdf" strokeOpacity="0.6" strokeWidth="0.018" />
            <motion.path
              initial={false}
              animate={{ d: shape.outline }}
              transition={morph}
              transform="translate(0 -0.05) scale(0.88 0.97)"
              fill={scent.liquid}
              clipPath={`url(#juice-${scent.id})`}
              opacity="0.92"
            />
            <motion.g initial={false} animate={{ y: -shape.neck }} transition={morph}>
              <rect x="-0.2" y="0" width="0.4" height="0.08" fill="#c9a46a" />
              <rect x="-0.28" y="-0.48" width="0.56" height="0.48" rx="0.03" fill="#1c1714" />
            </motion.g>
            {/* The house name, and the guest's words beneath it once typed, in gold on the glass */}
            <g fill="#e2bf7f" textAnchor="middle" fontFamily="var(--font-display)" data-testid="sheet-engraving">
              <text y="-0.68" fontSize="0.17" letterSpacing="0.04">
                KLIN
              </text>
              <text y="-0.48" fontSize={words ? 0.12 : 0.065} letterSpacing={words ? 0.01 : 0.03}>
                {words || "BANGKOK"}
              </text>
            </g>
          </motion.svg>
        </div>

        <motion.div
          className="flex flex-col gap-5 p-6 sm:p-8"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1], delay: 0.1 }}
        >
          <div className="flex items-start justify-between gap-4">
            <DialogHeader className="text-left">
              <DialogTitle className="font-heading text-4xl font-normal" style={{ color: scent.accent }}>
                {scent.name[locale]}
              </DialogTitle>
              <DialogDescription className="text-foreground">{scent.moment[locale]}</DialogDescription>
            </DialogHeader>
            <DialogClose className="-mt-1 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
              <XIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">{t.sheet.close}</span>
            </DialogClose>
          </div>
          <p className="leading-relaxed text-muted-foreground">{scent.story[locale]}</p>
          <dl className="grid grid-cols-3 gap-4 border-y border-border py-4 text-sm" aria-label={t.sheet.notes}>
            {(["top", "heart", "base"] as const).map((layer) => (
              <div key={layer}>
                <dt className="text-muted-foreground">{t.chapter.notes[layer]}</dt>
                {scent.notes[layer][locale].map((note) => (
                  <dd key={note} className="mt-1">
                    {note}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2">
            <p id={`size-${scent.id}`} className="text-sm text-muted-foreground">
              {t.sheet.size}
            </p>
            <ToggleGroup type="single" variant="outline" value={ml} onValueChange={(value) => {
                if (!value) return
                setMl(value)
                onSize?.(Number(value))
              }} aria-labelledby={`size-${scent.id}`} className="w-full">
              {scent.sizes.map((option) => (
                <ToggleGroupItem
                  key={option.ml}
                  value={String(option.ml)}
                  aria-label={t.sheet.sizeOption(option.ml, formatPrice(option.price))}
                  className="h-auto flex-1 flex-col gap-0.5 py-2.5 data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  <span className="text-base font-medium tabular-nums">{t.sheet.ml(option.ml)}</span>
                  <span className="text-xs tabular-nums opacity-80">{formatPrice(option.price)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Field>
            <FieldLabel htmlFor={`engrave-${scent.id}`} className="font-normal text-muted-foreground">
              {t.sheet.engraving}
            </FieldLabel>
            <Input
              id={`engrave-${scent.id}`}
              value={engraving}
              onChange={(event) => {
                const next = cleanEngraving(event.target.value, true)
                setEngraving(next)
                onEngrave?.(cleanEngraving(next))
              }}
              placeholder={t.sheet.engravingPlaceholder}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`engrave-${scent.id}-hint`}
              className="h-11 bg-transparent"
            />
            <FieldDescription id={`engrave-${scent.id}-hint`} className="tabular-nums">
              {t.sheet.engravingHint(engravingLeft(engraving))}
            </FieldDescription>
          </Field>
          <Magnetic className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                add(scent.id, size.ml, words)
                toast.success(t.sheet.added(scent.name[locale], size.ml))
                onAdded()
              }}
              className="h-12 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]"
            >
              {t.sheet.add(formatPrice(size.price))}
            </button>
          </Magnetic>
        </motion.div>
      </MotionConfig>
    </DialogContent>
  )
}
