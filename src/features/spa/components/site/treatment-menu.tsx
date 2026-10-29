"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { services, type ServiceCategory } from "../../data/services"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { formatBaht } from "../../lib/format"
import { formatDuration } from "../../lib/time"
import { PressureMeter } from "../shared"

type Filter = "all" | ServiceCategory
const filterOrder: Filter[] = ["all", "massage", "ritual", "feet"]

export function TreatmentMenu() {
  const { locale, t, href } = useSpaI18n()
  const [filter, setFilter] = useState<Filter>("all")
  const visible = services.filter((service) => filter === "all" || service.category === filter)

  return (
    <section id="treatments" aria-labelledby="treatments-title" className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-xl flex-col gap-3">
            <h2 id="treatments-title" className="font-heading text-4xl sm:text-5xl">
              {t.menu.title}
            </h2>
            <p className="text-muted-foreground">{t.menu.intro}</p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={filter}
            onValueChange={(value) => value && setFilter(value as Filter)}
            aria-label={t.menu.filter}
            className="flex-wrap"
          >
            {filterOrder.map((value) => (
              <ToggleGroupItem key={value} value={value} className="px-3">
                {t.menu.filters[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <ul className="flex flex-col divide-y divide-border border-y border-border" aria-live="polite">
          {visible.map((service) => (
            <li key={service.id} className="group relative grid gap-4 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-6">
              <Image
                src={service.image}
                alt=""
                width={288}
                height={192}
                sizes="(min-width: 640px) 144px, 100vw"
                loading="lazy"
                className="aspect-[3/2] w-full rounded-md object-cover sm:w-36"
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="font-heading text-2xl">
                  <Link
                    href={href(`/spa/book?service=${service.id}`)}
                    className="rounded-sm after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {service.name[locale]}
                  </Link>
                </h3>
                <p className="max-w-prose text-muted-foreground">{service.summary[locale]}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <PressureMeter level={service.pressure} locale={locale} />
                  {service.popular && <span className="text-xs font-medium text-teak">{t.menu.favourite}</span>}
                </div>
              </div>
              <dl className="flex gap-5 sm:flex-col sm:items-end sm:gap-1">
                {service.options.map((option) => (
                  <div key={option.minutes} className="flex items-baseline gap-2 tabular-nums">
                    <dt className="text-sm text-muted-foreground">{formatDuration(option.minutes, locale)}</dt>
                    <dd className="font-medium">{formatBaht(option.price)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
