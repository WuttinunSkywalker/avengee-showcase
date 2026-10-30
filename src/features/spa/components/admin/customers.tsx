"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MailIcon, PhoneIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { Locale } from "@/i18n/config"
import { customers as customerList } from "../../data/customers"
import { getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { CUSTOMER_SORTS, customerProfiles, findCustomers, SEED_NOTES, type CustomerProfile, type CustomerSort } from "../../lib/customers"
import { formatBaht } from "../../lib/format"
import { formatShortDate, formatTimeRange } from "../../lib/time"
import { useBookingsStore } from "../../store/bookings-store"
import { useCustomerNotesStore } from "../../store/customer-notes-store"
import { StatusBadge } from "../shared"

const byId = new Map(customerList.map((customer) => [customer.id, customer]))

/**
 * Every guest the spa has seen, from the booking history: how often they
 * come, what they've spent, what they usually have, and the front desk's
 * notes. Search, sort and the open guest live in the URL.
 */
export function Customers() {
  const { locale, t } = useSpaI18n()
  const c = t.admin.customers
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const data = useSpaData()
  useStorageSync(useBookingsStore.persist)
  const q = params.get("q") ?? ""
  const sortParam = params.get("sort") as CustomerSort | null
  const sort: CustomerSort = sortParam && CUSTOMER_SORTS.includes(sortParam) ? sortParam : "spend"
  const openKey = params.get("guest")
  const [query, setQuery] = useState(q)

  const profiles = useMemo(
    () =>
      data.ready
        ? customerProfiles(data.bookings, data.now, { country: (key) => byId.get(key)?.country, regular: (key) => byId.get(key)?.regular })
        : [],
    [data],
  )
  const shown = findCustomers(profiles, q, sort)
  const open = profiles.find((profile) => profile.key === openKey)

  const go = (next: Record<string, string | null>) => {
    const search = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value)
      else search.delete(key)
    }
    const text = search.toString()
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">{c.title}</h1>
        {data.ready && <p className="text-muted-foreground" data-testid="customer-count">{c.count(shown.length)}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form
          role="search"
          className="w-full sm:w-80"
          onSubmit={(event) => {
            event.preventDefault()
            go({ q: query.trim() || null })
          }}
        >
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label={c.search}
              placeholder={c.searchPlaceholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                // Clearing the box shows everyone again straight away
                if (!event.target.value) go({ q: null })
              }}
            />
          </InputGroup>
        </form>
        <Select value={sort} onValueChange={(value) => go({ sort: value === "spend" ? null : value })}>
          <SelectTrigger className="w-48" aria-label={c.sort}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CUSTOMER_SORTS.map((value) => (
              <SelectItem key={value} value={value}>
                {c.sorts[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!data.ready ? (
        <Skeleton className="h-96" aria-busy="true" />
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">{c.empty}</p>
      ) : (
        <>
          <Card className="hidden py-0 md:flex">
            <CardContent className="px-0">
              <Table data-testid="customers-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">{c.columns.guest}</TableHead>
                    <TableHead className="text-right">{c.columns.visits}</TableHead>
                    <TableHead className="text-right">{c.columns.spend}</TableHead>
                    <TableHead>{c.columns.last}</TableHead>
                    <TableHead className="pr-4">{c.columns.next}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((profile) => (
                    <TableRow key={profile.key}>
                      <TableCell className="pl-4">
                        <button
                          type="button"
                          onClick={() => go({ guest: profile.key })}
                          className="rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label={c.open(profile.name)}
                        >
                          {profile.name}
                        </button>
                        {profile.regular && (
                          <Badge variant="secondary" className="ml-2">
                            {c.regular}
                          </Badge>
                        )}
                        <span className="block text-xs text-muted-foreground">{profile.email}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{profile.visits}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBaht(profile.spend)}</TableCell>
                      <TableCell>{profile.lastVisit ? formatShortDate(profile.lastVisit.date, locale) : <span className="text-muted-foreground">{c.never}</span>}</TableCell>
                      <TableCell className="pr-4">{profile.nextVisit ? formatShortDate(profile.nextVisit.date, locale) : <span className="text-muted-foreground">{c.none}</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card md:hidden" data-testid="customers-list">
            {shown.map((profile) => (
              <li key={profile.key}>
                <button
                  type="button"
                  onClick={() => go({ guest: profile.key })}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                  aria-label={c.open(profile.name)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{profile.name}</span>
                    <span className="block text-sm text-muted-foreground">{c.profile.visits(profile.visits)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatBaht(profile.spend)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ProfileSheet profile={open} locale={locale} onClose={() => go({ guest: null })} />
    </div>
  )
}

function ProfileSheet({ profile, locale, onClose }: { profile: CustomerProfile | undefined; locale: Locale; onClose: () => void }) {
  const { t } = useSpaI18n()
  const p = t.admin.customers.profile
  const ready = usePersistHydrated(useCustomerNotesStore.persist)
  useStorageSync(useCustomerNotesStore.persist)
  const saved = useCustomerNotesStore((state) => (profile ? state.notes[profile.key] : undefined))
  const setNote = useCustomerNotesStore((state) => state.setNote)
  const service = profile?.favouriteService ? getService(profile.favouriteService) : undefined
  const therapist = profile?.favouriteTherapist ? getTherapist(profile.favouriteTherapist) : undefined

  return (
    <Sheet open={Boolean(profile)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md" data-testid="customer-sheet">
        {profile && (
          <>
            <SheetHeader className="pr-12">
              <SheetTitle className="font-heading text-2xl font-normal">{profile.name}</SheetTitle>
              <SheetDescription>
                {p.visits(profile.visits)}
                {profile.noShows > 0 && `, ${p.noShows(profile.noShows)}`}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <section aria-labelledby="customer-contact" className="flex flex-col gap-1.5 text-sm">
                <h3 id="customer-contact" className="text-muted-foreground">
                  {p.contact}
                </h3>
                <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                  <MailIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {profile.email}
                </a>
                {profile.phone && (
                  <a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 tabular-nums underline-offset-4 hover:underline">
                    <PhoneIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {profile.phone}
                  </a>
                )}
              </section>

              <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">{p.spend}</dt>
                  <dd className="font-heading text-xl tabular-nums" data-testid="customer-spend">
                    {formatBaht(profile.spend)}
                  </dd>
                </div>
                {service && therapist && (
                  <div>
                    <dt className="text-muted-foreground">{p.favourite}</dt>
                    <dd>{p.favouriteWith(service.name[locale], therapist.name[locale])}</dd>
                  </div>
                )}
              </dl>

              {ready && <NoteField key={profile.key} initial={saved ?? SEED_NOTES[profile.key] ?? ""} onSave={(note) => setNote(profile.key, note)} />}

              <section aria-labelledby="customer-history" className="flex flex-col gap-2">
                <h3 id="customer-history" className="text-sm text-muted-foreground">
                  {p.history}
                </h3>
                <ol className="flex flex-col divide-y divide-border rounded-lg border border-border" data-testid="customer-history">
                  {[...profile.bookings].reverse().map((booking) => (
                    <li key={booking.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                      <span className="min-w-0">
                        <span className="block font-medium">{getService(booking.serviceId)?.name[locale]}</span>
                        <span className="block text-muted-foreground tabular-nums">
                          {formatShortDate(booking.date, locale)} {formatTimeRange(booking.start, booking.duration)}, {getTherapist(booking.therapistId)?.name[locale]}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={booking.status} locale={locale} />
                        <span className="tabular-nums">{formatBaht(booking.total)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function NoteField({ initial, onSave }: { initial: string; onSave: (note: string) => void }) {
  const { t } = useSpaI18n()
  const p = t.admin.customers.profile
  const [note, setNote] = useState(initial)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(note.trim())
        toast.success(p.saved)
      }}
    >
      <Field>
        <FieldLabel htmlFor="customer-note">{p.notes}</FieldLabel>
        <Textarea id="customer-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        <FieldDescription>{p.notesHint}</FieldDescription>
      </Field>
      <Button type="submit" variant="outline" className="self-start" disabled={note.trim() === initial.trim()}>
        {p.save}
      </Button>
    </form>
  )
}
