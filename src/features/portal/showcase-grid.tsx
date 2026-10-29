"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { showcaseKinds, showcases, type Showcase, type ShowcaseKind } from "@/config/site"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { stagger } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"
import { ShowcasePreview } from "./showcase-preview"

type Filter = "all" | ShowcaseKind

export function ShowcaseGrid() {
  const locale = useLocale()
  const t = portalMessages[locale].showcases
  const [filter, setFilter] = useState<Filter>("all")
  const kinds = [...new Set(showcases.map((showcase) => showcase.kind))]
  // Open apps first, then what's coming.
  const visible = showcases
    .filter((showcase) => filter === "all" || showcase.kind === filter)
    .toSorted((a, b) => Number(a.status !== "live") - Number(b.status !== "live"))

  return (
    <div className="flex flex-col gap-8">
      {/* The reveal sits on a wrapper: ToggleGroup sets its own --gap through style, which a style prop would replace. */}
      <div className="reveal" style={stagger(1)}>
        <ToggleGroup
          className="flex-wrap justify-start"
          type="single"
          variant="outline"
          value={filter}
          onValueChange={(value) => value && setFilter(value as Filter)}
          aria-label={t.filter}
        >
          <ToggleGroupItem value="all" className="px-3">
            {t.all}
          </ToggleGroupItem>
          {kinds.map((kind) => (
            <ToggleGroupItem key={kind} value={kind} className="px-3">
              {showcaseKinds[kind][locale]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.map((showcase, index) =>
          showcase.status === "live" ? (
            <LiveCard key={showcase.id} showcase={showcase} locale={locale} />
          ) : (
            <SoonCard key={showcase.id} showcase={showcase} locale={locale} index={index} />
          ),
        )}
      </ul>
    </div>
  )
}

function LiveCard({ showcase, locale }: { showcase: Showcase; locale: Locale }) {
  const t = portalMessages[locale].showcases
  // The preview plays while the pointer is over the card or focus is inside it.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const active = hovered || focused
  return (
    <li
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setFocused(false)}
      className="group flex flex-col overflow-clip rounded-2xl border border-border bg-card shadow-sm md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[1.5fr_1fr]">
      {showcase.images && <ShowcasePreview showcase={showcase} locale={locale} active={active} />}
      {/* A container, so the feature list and buttons fit the column's real width, not the viewport's. */}
      <div className="@container flex flex-col gap-5 p-6 sm:p-8">
        <div className="reveal flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            {t.live}
          </Badge>
          <Badge variant="outline">{showcaseKinds[showcase.kind][locale]}</Badge>
        </div>
        <div className="reveal flex flex-col gap-1.5" style={stagger(1)}>
          <h3 className="font-heading text-3xl font-semibold tracking-tight" translate="no">
            {showcase.name}
          </h3>
          <p className="text-sm text-muted-foreground">{showcase.category[locale]}</p>
        </div>
        <p className="reveal leading-relaxed text-muted-foreground" style={stagger(2)}>
          {showcase.summary[locale]}
        </p>
        <ul className="reveal grid gap-x-4 gap-y-1.5 text-sm @xs:grid-cols-2" style={stagger(3)}>
          {showcase.features[locale].map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
        {/* Same width side by side when there's room, stacked full width when there isn't. */}
        <div className="reveal mt-auto grid gap-3 pt-2 @xs:grid-cols-2" style={stagger(4)}>
          {showcase.href && (
            <Button asChild size="xl" className="w-full">
              <Link href={localePath(locale, showcase.href)}>
                {t.open}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {showcase.adminHref && (
            <Button asChild size="xl" variant="outline" className="w-full">
              <Link href={localePath(locale, showcase.adminHref)}>{t.admin}</Link>
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

const soonPatterns: Record<ShowcaseKind, string> = {
  booking: "bg-[radial-gradient(circle_at_30%_30%,var(--accent)_0,transparent_55%)]",
  marketplace: "bg-[radial-gradient(circle_at_70%_20%,var(--accent)_0,transparent_55%)]",
  shop: "bg-[radial-gradient(circle_at_20%_80%,var(--accent)_0,transparent_55%)]",
  restaurant: "bg-[radial-gradient(circle_at_80%_70%,var(--accent)_0,transparent_55%)]",
  landing: "bg-[radial-gradient(circle_at_50%_50%,var(--accent)_0,transparent_60%)]",
}

function SoonCard({ showcase, locale, index }: { showcase: Showcase; locale: Locale; index: number }) {
  const t = portalMessages[locale].showcases
  return (
    <li className="reveal flex flex-col overflow-clip rounded-2xl border border-dashed border-border bg-card/60" style={stagger(index % 3)}>
      <div className={cn("relative h-36 border-b border-dashed border-border", soonPatterns[showcase.kind])} aria-hidden="true">
        {/* A quiet wireframe hint of the layout to come */}
        <div className="absolute inset-x-6 top-6 flex flex-col gap-2 opacity-60">
          <span className="h-2.5 w-1/3 rounded-full bg-border" />
          <span className="h-2 w-2/3 rounded-full bg-border" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <span className="h-12 rounded-md bg-border/70" />
            <span className="h-12 rounded-md bg-border/70" />
            <span className="h-12 rounded-md bg-border/70" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t.soon}</Badge>
          <Badge variant="outline">{showcaseKinds[showcase.kind][locale]}</Badge>
        </div>
        <h3 className="font-heading text-xl font-semibold tracking-tight" translate="no">
          {showcase.name}
        </h3>
        <p className="text-sm text-muted-foreground">{showcase.category[locale]}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{showcase.summary[locale]}</p>
      </div>
    </li>
  )
}
