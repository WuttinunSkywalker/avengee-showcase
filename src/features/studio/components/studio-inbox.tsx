"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeftIcon, MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatLongDate, formatShortDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { studioMessages } from "../i18n/messages"
import { ENQUIRY_STATUSES, inbox, isOverdue, seededEnquiries, statusCounts, visitDateAllowed, type Enquiry, type EnquiryStatus } from "../lib/inbox"
import { useInboxStore } from "../store/inbox-store"
import { SornMark } from "./studio-chrome"

type Filter = EnquiryStatus | "all"
const BANGKOK = 7 * 3_600_000
const bangkokDay = (iso: string) => new Date(Date.parse(iso) + BANGKOK).toISOString().slice(0, 10)
const bangkokTime = (iso: string) => new Date(Date.parse(iso) + BANGKOK).toISOString().slice(11, 16)

/**
 * The studio's inbox: every enquiry from the website, newest first, with
 * what it's about and what happens next. The open enquiry and filter live in
 * the URL, so a link to one can be passed round the studio.
 */
export function StudioInbox() {
  const locale = useLocale()
  const t = studioMessages[locale].inbox
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const now = useNow()
  const ready = usePersistHydrated(useInboxStore.persist)
  useStorageSync(useInboxStore.persist)
  const mine = useInboxStore((state) => state.mine)
  const changes = useInboxStore((state) => state.changes)
  const minute = now ? Math.floor(now.getTime() / 60_000) : null
  const seeded = useMemo(() => (minute === null ? [] : seededEnquiries(new Date(minute * 60_000))), [minute])
  const all = ready && now ? inbox(seeded, mine, changes) : []
  const filterParam = params.get("show") as Filter | null
  const filter: Filter = filterParam && (ENQUIRY_STATUSES as readonly string[]).includes(filterParam) ? filterParam : "all"
  const shown = filter === "all" ? all : all.filter((enquiry) => enquiry.status === filter)
  const openRef = params.get("id")
  const open = all.find((enquiry) => enquiry.reference === openRef)
  const counts = statusCounts(all)

  const go = (next: { id?: string | null; show?: Filter }) => {
    const query = new URLSearchParams(params.toString())
    if (next.id !== undefined) {
      if (next.id) query.set("id", next.id)
      else query.delete("id")
    }
    if (next.show !== undefined) {
      if (next.show === "all") query.delete("show")
      else query.set("show", next.show)
    }
    const search = query.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-foreground/80 bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={localePath(locale, "/studio")} className="flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <SornMark className="size-7" />
            <span className="text-lg font-medium tracking-tight">Sorn Studio</span>
          </Link>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle label={locale === "th" ? "สลับโหมดมืด" : "Toggle dark mode"} />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-4xl font-light tracking-tight">{t.title}</h1>
        {!ready || !now ? (
          <Skeleton className="h-96" aria-busy="true" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <section className={cn("flex min-w-0 flex-col gap-4", open && "hidden lg:flex")} aria-label={t.title}>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={(value) => value && go({ show: value as Filter, id: null })}
                aria-label={t.filterLabel}
                className="flex-wrap justify-start"
              >
                {(["all", ...ENQUIRY_STATUSES] as const).map((value) => (
                  <ToggleGroupItem key={value} value={value} className="px-3">
                    {value === "all" ? t.all : t.statuses[value]} <span className="text-muted-foreground tabular-nums">{counts[value]}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {shown.length === 0 ? (
                <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border border border-foreground/80 bg-card" data-testid="enquiry-list">
                  {shown.map((enquiry) => (
                    <li key={enquiry.reference}>
                      <EnquiryRow enquiry={enquiry} now={now} locale={locale} selected={enquiry.reference === openRef} onOpen={() => go({ id: enquiry.reference })} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={cn("min-w-0", !open && "hidden lg:block")} aria-live="polite">
              {open ? (
                <EnquiryDetail enquiry={open} now={now} locale={locale} onBack={() => go({ id: null })} />
              ) : (
                <p className="flex h-full min-h-60 items-center justify-center border border-dashed border-border p-8 text-sm text-muted-foreground">{t.choose}</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function EnquiryRow({ enquiry, now, locale, selected, onOpen }: { enquiry: Enquiry; now: Date; locale: Locale; selected: boolean; onOpen: () => void }) {
  const t = studioMessages[locale]
  const overdue = isOverdue(enquiry, now)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={selected ? "true" : undefined}
      className={cn("flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset", selected && "bg-muted")}
      data-testid="enquiry-row"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="truncate font-medium">{enquiry.values.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatShortDate(bangkokDay(enquiry.sentAt), locale)}</span>
      </span>
      <span className="truncate text-sm text-muted-foreground">
        {t.inbox.where(t.services.items[enquiry.values.type].name, enquiry.values.location)}
      </span>
      <span className="flex flex-wrap items-center gap-2 text-xs">
        <StatusMark status={enquiry.status} locale={locale} />
        {overdue && <span className="font-medium text-destructive">{t.inbox.overdue}</span>}
        {enquiry.yours && <span className="text-leaf">{t.inbox.fromHere}</span>}
      </span>
    </button>
  )
}

function StatusMark({ status, locale }: { status: EnquiryStatus; locale: Locale }) {
  return (
    <span className={cn("border px-1.5 py-0.5 leading-none", status === "new" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground")}>
      {studioMessages[locale].inbox.statuses[status]}
    </span>
  )
}

function EnquiryDetail({ enquiry, now, locale, onBack }: { enquiry: Enquiry; now: Date; locale: Locale; onBack: () => void }) {
  const t = studioMessages[locale]
  const i = t.inbox
  const form = t.contact.form
  const setStatus = useInboxStore((state) => state.setStatus)
  const [booking, setBooking] = useState(false)
  const v = enquiry.values
  const overdue = isOverdue(enquiry, now)

  // Booking a visit has its own dialog; these move an enquiry on in one click
  const move = (status: Exclude<EnquiryStatus, "visit">) => {
    setStatus(enquiry.reference, status)
    toast.success(i.done[status])
  }

  const facts: [string, string][] = [
    [t.contact.done.labels.type, t.services.items[v.type].name],
    [t.contact.done.labels.location, v.location],
    ...(v.area ? ([[t.contact.done.labels.area, t.contact.done.area(v.area)]] as [string, string][]) : []),
    [t.contact.done.labels.budget, form.budgets[v.budget as keyof typeof form.budgets]],
    [t.contact.done.labels.timing, form.timings[v.timing as keyof typeof form.timings]],
  ]

  return (
    <article className="flex flex-col gap-6 border border-foreground/80 bg-card p-5 sm:p-8" data-testid="enquiry-detail">
      <Button variant="ghost" size="sm" className="self-start lg:hidden" onClick={onBack}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        {i.back}
      </Button>
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground tabular-nums">{enquiry.reference}</p>
        <h2 className="text-3xl font-light tracking-tight">{v.name}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <StatusMark status={enquiry.status} locale={locale} />
          <span className="text-muted-foreground">{i.received(formatLongDate(bangkokDay(enquiry.sentAt), locale), bangkokTime(enquiry.sentAt))}</span>
          {enquiry.status === "new" && <span className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>{overdue ? i.overdue : i.replyBy(formatLongDate(enquiry.replyBy, locale))}</span>}
          {enquiry.status === "visit" && enquiry.visitOn && <span className="font-medium">{i.visitOn(formatLongDate(enquiry.visitOn, locale))}</span>}
        </p>
      </header>

      <section aria-labelledby="enquiry-brief" className="flex flex-col gap-2">
        <h3 id="enquiry-brief" className="text-sm text-muted-foreground">
          {i.brief}
        </h3>
        <blockquote className="border-l-2 border-leaf pl-4 text-lg leading-relaxed text-pretty">{v.brief}</blockquote>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="enquiry-project" className="flex flex-col gap-2">
          <h3 id="enquiry-project" className="text-sm text-muted-foreground">
            {i.project}
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="enquiry-client" className="flex flex-col gap-2">
          <h3 id="enquiry-client" className="text-sm text-muted-foreground">
            {i.client}
          </h3>
          <p className="text-sm">{i.reach(t.contact.done.methods[v.method])}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li>
              <a href={`mailto:${v.email}`} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                <MailIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                {v.email}
              </a>
            </li>
            {v.phone && (
              <li>
                <a href={`tel:${v.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 tabular-nums underline-offset-4 hover:underline">
                  <PhoneIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {v.phone}
                </a>
              </li>
            )}
            {v.lineId && (
              <li className="inline-flex items-center gap-2">
                <MessageCircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                LINE {v.lineId}
              </li>
            )}
          </ul>
        </section>
      </div>

      <section aria-labelledby="enquiry-actions" className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 id="enquiry-actions" className="text-sm text-muted-foreground">
          {i.actions}
        </h3>
        <div className="flex flex-wrap gap-2">
          {enquiry.status === "new" && <Button onClick={() => move("replied")}>{i.markReplied}</Button>}
          {(enquiry.status === "new" || enquiry.status === "replied") && (
            <Button variant={enquiry.status === "replied" ? "default" : "outline"} onClick={() => setBooking(true)}>
              {i.bookVisit}
            </Button>
          )}
          {enquiry.status !== "closed" ? (
            <Button variant="ghost" onClick={() => move("closed")}>
              {i.close}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => move("new")}>
              {i.reopen}
            </Button>
          )}
        </div>
      </section>
      <VisitDialog enquiry={enquiry} now={now} locale={locale} open={booking} onOpenChange={setBooking} />
    </article>
  )
}

function VisitDialog({ enquiry, now, locale, open, onOpenChange }: { enquiry: Enquiry; now: Date; locale: Locale; open: boolean; onOpenChange: (open: boolean) => void }) {
  const i = studioMessages[locale].inbox
  const setStatus = useInboxStore((state) => state.setStatus)
  const [date, setDate] = useState("")
  const [error, setError] = useState(false)
  const min = new Date(now.getTime() + BANGKOK + 86_400_000).toISOString().slice(0, 10)
  const max = new Date(now.getTime() + BANGKOK + 56 * 86_400_000).toISOString().slice(0, 10)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setError(false)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!visitDateAllowed(date, now)) {
              setError(true)
              return
            }
            setStatus(enquiry.reference, "visit", date)
            toast.success(i.done.visit(formatLongDate(date, locale)))
            onOpenChange(false)
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-tight">{i.visitTitle}</DialogTitle>
            <DialogDescription>{i.visitBody(enquiry.values.name)}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={error}>
            <FieldLabel htmlFor="visit-date">{i.visitDate}</FieldLabel>
            <Input
              id="visit-date"
              type="date"
              min={min}
              max={max}
              value={date}
              aria-invalid={error}
              onChange={(event) => {
                setDate(event.target.value)
                setError(false)
              }}
            />
            {error && <FieldError>{i.visitError}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {i.cancel}
            </Button>
            <Button type="submit">{i.confirmVisit}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
