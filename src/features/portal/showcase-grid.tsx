"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { showcaseKinds, showcases, type Showcase, type ShowcaseKind } from "@/config/site"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"
import { portalMessages } from "./messages"

type Filter = "all" | ShowcaseKind

export function ShowcaseGrid() {
  const locale = useLocale()
  const t = portalMessages[locale].showcases
  const [filter, setFilter] = useState<Filter>("all")
  const kinds = [...new Set(showcases.map((showcase) => showcase.kind))]
  const visible = showcases.filter((showcase) => filter === "all" || showcase.kind === filter)

  return (
    <div className="flex flex-col gap-8">
      <ToggleGroup
        type="single"
        variant="outline"
        value={filter}
        onValueChange={(value) => value && setFilter(value as Filter)}
        aria-label={t.filter}
        className="flex-wrap justify-start"
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

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.map((showcase) =>
          showcase.status === "live" ? (
            <LiveCard key={showcase.id} showcase={showcase} locale={locale} />
          ) : (
            <SoonCard key={showcase.id} showcase={showcase} locale={locale} />
          ),
        )}
      </ul>
    </div>
  )
}

function LiveCard({ showcase, locale }: { showcase: Showcase; locale: Locale }) {
  const t = portalMessages[locale].showcases
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:col-span-2 lg:grid lg:grid-cols-[1.35fr_1fr]">
      {showcase.images && (
        <div className="relative overflow-hidden border-b border-border bg-muted lg:border-r lg:border-b-0">
          <Image
            src={showcase.images.desktop[locale]}
            alt={showcase.images.alt[locale]}
            width={1440}
            height={900}
            sizes="(min-width: 1024px) 700px, 100vw"
            loading="eager"
            style={{ objectPosition: showcase.images.focus ?? "left top" }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
          {/* Phone view of the booking flow, tucked into the corner */}
          <Image
            src={showcase.images.mobile[locale]}
            alt=""
            width={393}
            height={659}
            sizes="140px"
            className={cn(
              "absolute bottom-4 hidden w-32 rounded-[1.1rem] border-[3px] border-foreground/85 shadow-2xl sm:block lg:w-36",
              showcase.images.phoneSide === "left" ? "left-4" : "right-4",
            )}
          />
        </div>
      )}
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            {t.live}
          </Badge>
          <Badge variant="outline">{showcaseKinds[showcase.kind][locale]}</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-3xl font-semibold tracking-tight" translate="no">
            {showcase.name}
          </h3>
          <p className="text-sm text-muted-foreground">{showcase.category[locale]}</p>
        </div>
        <p className="leading-relaxed text-muted-foreground">{showcase.summary[locale]}</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {showcase.features[locale].map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          {showcase.href && (
            <Button asChild size="xl">
              <Link href={localePath(locale, showcase.href)}>
                {t.open}
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {showcase.adminHref && (
            <Button asChild size="xl" variant="outline">
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

function SoonCard({ showcase, locale }: { showcase: Showcase; locale: Locale }) {
  const t = portalMessages[locale].showcases
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-card/60">
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
