"use client"

import { useState } from "react"
import { motion, MotionConfig } from "motion/react"
import { XIcon } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale } from "@/i18n/locale-provider"
import { getScent, type Scent, type ScentId } from "../data/scents"
import { klinMessages } from "../i18n/messages"
import { bottleSilhouette } from "../lib/bottle"
import { formatPrice } from "../lib/story"
import { useBagStore } from "../store/bag-store"

const SILHOUETTE = bottleSilhouette()

/** The pop-up for one scent: a drawn bottle in its colours, the notes, a size and the bag button. */
export function ScentSheet({ scentId, onClose }: { scentId: ScentId | null; onClose: () => void }) {
  const scent = scentId ? getScent(scentId) : undefined
  return (
    <Dialog open={Boolean(scent)} onOpenChange={(open) => !open && onClose()}>
      {scent && <SheetBody key={scent.id} scent={scent} onAdded={onClose} />}
    </Dialog>
  )
}

function SheetBody({ scent, onAdded }: { scent: Scent; onAdded: () => void }) {
  const locale = useLocale()
  const t = klinMessages[locale]
  const [ml, setMl] = useState(String(scent.sizes[1].ml))
  const size = scent.sizes.find((option) => String(option.ml) === ml) ?? scent.sizes[1]
  const add = useBagStore((state) => state.add)

  return (
    <DialogContent
      showCloseButton={false}
      data-lenis-prevent
      className="max-h-[92svh] gap-0 overflow-y-auto border-border p-0 sm:max-w-3xl md:grid md:grid-cols-[0.9fr_1.1fr]"
      style={{ backgroundColor: scent.backdrop }}
      data-testid="scent-sheet"
    >
      <MotionConfig reducedMotion="user">
        {/* The bottle pops up and settles, its juice filling from the base */}
        <div className="relative flex min-h-56 items-end justify-center overflow-hidden pt-10 md:min-h-full" style={{ background: `radial-gradient(70% 60% at 50% 62%, ${scent.liquid}55, transparent 70%)` }} aria-hidden="true">
          <motion.svg
            viewBox="-1 -2.45 2 2.5"
            className="h-48 w-auto md:h-72"
            initial={{ y: 60, scale: 0.85, rotate: -6 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.05 }}
          >
            <defs>
              <clipPath id={`juice-${scent.id}`}>
                <motion.rect x="-1" width="2" initial={{ y: 0, height: 0 }} animate={{ y: -1.18, height: 1.02 }} transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1], delay: 0.25 }} />
              </clipPath>
            </defs>
            <path d={SILHOUETTE} fill="#ffffff10" stroke="#f1ebdf" strokeOpacity="0.55" strokeWidth="0.018" />
            <path d={SILHOUETTE} transform="translate(0 -0.05) scale(0.88 0.97)" fill={scent.liquid} clipPath={`url(#juice-${scent.id})`} opacity="0.92" />
            <rect x="-0.2" y="-1.92" width="0.4" height="0.08" fill="#c9a46a" />
            <rect x="-0.28" y="-2.4" width="0.56" height="0.48" rx="0.03" fill="#1c1714" />
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
            <ToggleGroup type="single" variant="outline" value={ml} onValueChange={(value) => value && setMl(value)} aria-labelledby={`size-${scent.id}`} className="w-full">
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
          <button
            type="button"
            onClick={() => {
              add(scent.id, size.ml)
              toast.success(t.sheet.added(scent.name[locale], size.ml))
              onAdded()
            }}
            className="h-12 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]"
          >
            {t.sheet.add(formatPrice(size.price))}
          </button>
        </motion.div>
      </MotionConfig>
    </DialogContent>
  )
}
