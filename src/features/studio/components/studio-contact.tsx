"use client"

import { useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale } from "@/i18n/locale-provider"
import { formatLongDate } from "@/lib/dates"
import { SERVICES } from "../data/projects"
import { studioMessages } from "../i18n/messages"
import {
  BRIEF_MAX,
  BUDGETS,
  CONTACT_METHODS,
  createEnquirySchema,
  enquiryReference,
  replyBy,
  TIMINGS,
  type EnquiryValues,
} from "../lib/enquiry"

const SENDING_MS = 800

const empty: EnquiryValues = {
  type: undefined as unknown as EnquiryValues["type"],
  location: "",
  area: "",
  budget: undefined as unknown as EnquiryValues["budget"],
  timing: undefined as unknown as EnquiryValues["timing"],
  brief: "",
  name: "",
  email: "",
  phone: "",
  method: "email",
  lineId: "",
}

interface Sent {
  reference: string
  replyBy: string
  values: EnquiryValues
}

/**
 * The studio's enquiry form: what and where, budget and timing, a short brief,
 * and how to reply. Sending shows the enquiry number and a summary of the
 * brief, as the studio would see it arrive in LINE or email.
 */
export function StudioContact() {
  const locale = useLocale()
  const t = studioMessages[locale].contact
  const f = t.form
  const schema = useMemo(() => createEnquirySchema(f.errors), [f.errors])
  const form = useForm<EnquiryValues>({ resolver: zodResolver(schema), defaultValues: empty, mode: "onTouched" })
  const [method, brief] = useWatch({ control: form.control, name: ["method", "brief"] })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Sent | null>(null)

  const onSubmit = form.handleSubmit(async (values) => {
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, SENDING_MS))
    const now = new Date()
    setSent({ reference: enquiryReference(now), replyBy: replyBy(now), values })
    setSending(false)
    requestAnimationFrame(() => document.getElementById("enquiry-sent")?.focus())
  })

  if (sent) {
    const v = sent.values
    const l = t.done.labels
    const rows: [string, string][] = [
      [l.type, studioMessages[locale].services.items[v.type].name],
      [l.location, v.location],
      ...(v.area ? ([[l.area, t.done.area(v.area)]] as [string, string][]) : []),
      [l.budget, f.budgets[v.budget]],
      [l.timing, f.timings[v.timing]],
      [l.method, v.method === "line" ? `${f.methods.line} ${v.lineId}` : v.method === "phone" ? `${f.methods.phone} ${v.phone}` : f.methods.email],
    ]
    return (
      <div id="enquiry-sent" tabIndex={-1} role="status" className="flex flex-col gap-6 border border-foreground/80 bg-card p-6 outline-none sm:p-8" data-testid="enquiry-sent">
        <span className="flex size-12 items-center justify-center rounded-full bg-leaf text-white dark:text-background">
          <CheckIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-light tracking-tight">{t.done.title(v.name.trim().split(/\s+/)[0])}</h3>
          <p className="text-muted-foreground">{t.done.body(t.done.methods[v.method], formatLongDate(sent.replyBy, locale))}</p>
        </div>
        <p className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">{t.done.reference}</span>
          <span className="text-xl font-medium tracking-wide tabular-nums" data-testid="enquiry-reference">
            {sent.reference}
          </span>
        </p>
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="text-sm font-medium">{t.done.summary}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm leading-relaxed whitespace-pre-line">{v.brief.trim()}</p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            form.reset(empty)
            setSent(null)
          }}
        >
          {t.done.another}
        </Button>
      </div>
    )
  }

  const text = (name: "location" | "area" | "name" | "email" | "phone" | "lineId", label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={`enquiry-${name}`}>{label}</FieldLabel>
          <Input {...field} id={`enquiry-${name}`} aria-invalid={fieldState.invalid} {...props} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8 border border-foreground/80 bg-card p-5 sm:p-8" data-testid="enquiry-form">
      <FieldSet>
        <FieldLegend className="text-lg font-medium">{f.project}</FieldLegend>
        <FieldGroup>
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel id="enquiry-type-label">{f.type}</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.value ?? ""}
                  onValueChange={(value) => {
                    if (!value) return
                    field.onChange(value)
                    field.onBlur()
                  }}
                  aria-labelledby="enquiry-type-label"
                  aria-invalid={fieldState.invalid}
                  className="flex-wrap justify-start"
                >
                  {SERVICES.map((service) => (
                    <ToggleGroupItem key={service} value={service} className="px-3">
                      {studioMessages[locale].services.items[service].name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
            {text("location", f.location, { placeholder: f.locationPlaceholder, autoComplete: "address-level2" })}
            {text("area", f.area, { placeholder: f.areaPlaceholder, inputMode: "numeric", maxLength: 4 })}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {(["budget", "timing"] as const).map((name) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor={`enquiry-${name}`}>{name === "budget" ? f.budget : f.timing}</FieldLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value)
                        field.onBlur()
                      }}
                    >
                      <SelectTrigger id={`enquiry-${name}`} className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder={name === "budget" ? f.budgetPlaceholder : f.timingPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(name === "budget" ? BUDGETS : TIMINGS).map((option) => (
                            <SelectItem key={option} value={option}>
                              {name === "budget" ? f.budgets[option as keyof typeof f.budgets] : f.timings[option as keyof typeof f.timings]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ))}
          </div>
          <Controller
            name="brief"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <div className="flex items-baseline justify-between gap-4">
                  <FieldLabel htmlFor="enquiry-brief">{f.brief}</FieldLabel>
                  <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                    {f.count(brief.length, BRIEF_MAX)}
                  </span>
                </div>
                <Textarea {...field} id="enquiry-brief" rows={5} aria-invalid={fieldState.invalid} aria-describedby="enquiry-brief-hint" />
                {fieldState.error ? <FieldError errors={[fieldState.error]} /> : <FieldDescription id="enquiry-brief-hint">{f.briefHint}</FieldDescription>}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="text-lg font-medium">{f.you}</FieldLegend>
        <FieldGroup>
          {text("name", f.name, { autoComplete: "name" })}
          <div className="grid gap-5 sm:grid-cols-2">
            {text("email", f.email, { type: "email", inputMode: "email", autoComplete: "email", spellCheck: false })}
            {text("phone", f.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "081 234 5678…" })}
          </div>
          <Controller
            name="method"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel id="enquiry-method-label">{f.method}</FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} aria-labelledby="enquiry-method-label" className="flex flex-wrap gap-x-6 gap-y-3">
                  {CONTACT_METHODS.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={`enquiry-method-${option}`} />
                      <FieldLabel htmlFor={`enquiry-method-${option}`} className="font-normal">
                        {f.methods[option]}
                      </FieldLabel>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
          {method === "line" && text("lineId", f.lineId, { placeholder: f.linePlaceholder, autoComplete: "off", spellCheck: false, autoCapitalize: "none" })}
        </FieldGroup>
      </FieldSet>

      <Button type="submit" size="xl" disabled={sending} className="self-start">
        {sending && <Spinner data-icon="inline-start" />}
        {sending ? f.sending : f.send}
      </Button>
    </form>
  )
}
