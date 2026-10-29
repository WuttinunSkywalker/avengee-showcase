"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { addOns, getService, lowestPrice, services } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { useBookingDraft } from "../../store/booking-draft-store"
import { formatBaht } from "../../lib/format"
import { formatDuration } from "../../lib/time"

export function TreatmentStep() {
  const { locale, t } = useSpaI18n()
  const { serviceId, minutes, addOnIds, therapist, selectService, setMinutes, toggleAddOn, setTherapist } = useBookingDraft()
  const preferred = therapist !== "any" ? getTherapist(therapist) : undefined
  const offered = preferred ? services.filter((service) => preferred.skills.includes(service.id)) : services
  const selected = serviceId ? getService(serviceId) : undefined

  return (
    <div className="flex flex-col gap-10">
      <FieldSet>
        <FieldLegend className="font-heading text-2xl font-normal">{t.treatment.choose}</FieldLegend>
        {preferred && (
          <FieldDescription className="flex flex-wrap items-center gap-x-2">
            {t.treatment.filtered(offered.length, preferred.name[locale])}
            <Button variant="link" className="h-auto p-0" onClick={() => setTherapist("any")}>
              {t.treatment.showAll}
            </Button>
          </FieldDescription>
        )}
        <RadioGroup
          value={serviceId ?? ""}
          onValueChange={(id) => {
            const service = getService(id)
            if (service) selectService(service.id, service.options[0].minutes)
          }}
          className="gap-3"
        >
          {offered.map((service) => (
            <FieldLabel key={service.id} htmlFor={`service-${service.id}`}>
              <Field orientation="horizontal" className="items-center gap-4">
                <RadioGroupItem value={service.id} id={`service-${service.id}`} />
                <Image
                  src={service.image}
                  alt=""
                  width={128}
                  height={96}
                  className="hidden aspect-[4/3] w-16 shrink-0 rounded-md object-cover sm:block"
                />
                <FieldContent className="min-w-0">
                  <FieldTitle className="text-base">{service.name[locale]}</FieldTitle>
                  <FieldDescription className="line-clamp-2">{service.summary[locale]}</FieldDescription>
                </FieldContent>
                <span className="shrink-0 text-right text-sm tabular-nums">
                  <span className="block text-xs text-muted-foreground">{t.treatment.from}</span>
                  {formatBaht(lowestPrice(service))}
                </span>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>

      {selected && selected.options.length > 1 && (
        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{t.treatment.length}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            value={String(minutes)}
            onValueChange={(value) => value && setMinutes(Number(value))}
            aria-label={t.treatment.lengthLabel}
            className="flex-wrap"
          >
            {selected.options.map((option) => (
              <ToggleGroupItem key={option.minutes} value={String(option.minutes)} className="h-auto flex-col gap-0 px-4 py-2">
                <span className="font-medium">{formatDuration(option.minutes, locale)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{formatBaht(option.price)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      )}

      {selected && (
        <FieldSet>
          <FieldLegend className="font-heading text-2xl font-normal">{t.treatment.extras}</FieldLegend>
          <FieldDescription>{t.treatment.extrasHint}</FieldDescription>
          <div className="flex flex-col gap-3">
            {addOns.map((addOn) => (
              <FieldLabel key={addOn.id} htmlFor={`addon-${addOn.id}`}>
                <Field orientation="horizontal" className="items-center">
                  <Checkbox
                    id={`addon-${addOn.id}`}
                    checked={addOnIds.includes(addOn.id)}
                    onCheckedChange={() => toggleAddOn(addOn.id)}
                  />
                  <FieldContent>
                    <FieldTitle>{addOn.name[locale]}</FieldTitle>
                    <FieldDescription>{addOn.description[locale]}</FieldDescription>
                  </FieldContent>
                  <span className="shrink-0 text-sm tabular-nums">+{formatBaht(addOn.price)}</span>
                </Field>
              </FieldLabel>
            ))}
          </div>
        </FieldSet>
      )}
    </div>
  )
}
