"use client"

import { useRef, useState } from "react"
import { CheckIcon, CopyIcon, MailIcon } from "lucide-react"
import { toast } from "sonner"
import { Magnetic } from "@/components/magnetic"
import { site } from "@/config/site"
import type { Locale } from "@/i18n/config"
import { portalMessages } from "./messages"
import { scrambled, SCRAMBLE_MS, settleTimes } from "./scramble"

/**
 * The contact band's email: a magnetic link whose address scrambles through
 * letters and settles left to right when pointed at or focused (its label
 * stays the real address throughout), and a button that copies the address
 * for visitors without a mail app set up. Nothing scrambles for reduced motion.
 */
export function ContactEmail({ locale }: { locale: Locale }) {
  const t = portalMessages[locale].contact
  const address = useRef<HTMLSpanElement>(null)
  const running = useRef(0)
  const [copied, setCopied] = useState(false)

  const scramble = () => {
    const node = address.current
    // The text node React rendered: its value changes, the node stays React's
    const text = node?.firstChild
    if (!node || !text || running.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const settle = settleTimes(site.email)
    // Hold the width the real address takes, so the letters can change without the card jiggling
    node.style.width = `${node.offsetWidth}px`
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      text.nodeValue = scrambled(site.email, elapsed, settle)
      if (elapsed < SCRAMBLE_MS) {
        running.current = requestAnimationFrame(step)
        return
      }
      text.nodeValue = site.email
      node.style.removeProperty("width")
      running.current = 0
    }
    running.current = requestAnimationFrame(step)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      toast.success(t.copied)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t.copyFailed)
    }
  }

  return (
    <>
      <Magnetic className="flex flex-col">
        <a
          href={`mailto:${site.email}`}
          aria-label={`${t.email} ${site.email}`}
          onPointerEnter={(event) => event.pointerType === "mouse" && scramble()}
          onFocus={scramble}
          className="flex items-center gap-3 rounded-xl bg-background px-5 py-4 text-foreground shadow-lg transition-shadow hover:shadow-2xl focus-visible:ring-3 focus-visible:ring-signal focus-visible:outline-none motion-reduce:transition-none"
        >
          <MailIcon className="size-5" aria-hidden="true" />
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t.email}</span>
            <span ref={address} data-testid="contact-address" className="inline-block overflow-hidden font-medium whitespace-nowrap">
              {site.email}
            </span>
          </span>
        </a>
      </Magnetic>
      <button
        type="button"
        onClick={copy}
        aria-label={t.copyLabel}
        className="flex items-center justify-center gap-2 rounded-xl border border-background/30 px-5 py-4 font-medium transition-colors hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-signal focus-visible:outline-none"
      >
        {copied ? <CheckIcon className="size-5" aria-hidden="true" /> : <CopyIcon className="size-5" aria-hidden="true" />}
        {t.copy}
      </button>
    </>
  )
}
