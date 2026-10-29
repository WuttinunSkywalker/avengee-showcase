"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getAddOn, getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { allowedTransitions } from "../../lib/booking-filters"
import { formatBaht } from "../../lib/format"
import { formatDuration, formatLongDate, formatTimeRange, type ZonedNow } from "../../lib/time"
import type { Booking, BookingStatus } from "../../lib/types"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { useBookingsStore } from "../../store/bookings-store"
import { StatusBadge, TherapistAvatar } from "../shared"

export function BookingDetailSheet({
  booking,
  now,
  onOpenChange,
}: {
  booking: Booking | undefined
  now: ZonedNow
  onOpenChange: (open: boolean) => void
}) {
  const { locale, t } = useSpaI18n()
  const setStatus = useBookingsStore((state) => state.setStatus)
  const [confirmCancel, setConfirmCancel] = useState(false)

  // Close the sheet after a change: a modal sheet blocks clicks outside it,
  // which would make the toast's Undo button unreachable.
  function change(target: Booking, status: BookingStatus) {
    const previous = target.status
    setStatus(target.id, status)
    onOpenChange(false)
    toast.success(t.sheet.changed(target.reference, t.status[status]), {
      action: {
        label: t.sheet.undo,
        onClick: () => {
          setStatus(target.id, previous)
          toast(t.sheet.reverted(target.reference, t.status[previous]))
        },
      },
    })
  }

  const service = booking ? getService(booking.serviceId) : undefined
  const therapist = booking ? getTherapist(booking.therapistId) : undefined
  const transitions = booking ? allowedTransitions(booking, now) : []

  return (
    <>
      <Sheet open={!!booking} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
          {booking && service && therapist && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.status} locale={locale} />
                  {booking.bookedOnDevice && <span className="text-xs text-muted-foreground">{t.sheet.newOnline}</span>}
                </div>
                <SheetTitle className="font-heading text-2xl font-normal">{booking.guest.name}</SheetTitle>
                <SheetDescription>{t.sheet.via(booking.reference, t.channel[booking.channel])}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5 px-4 text-sm">
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">{t.sheet.treatment}</dt>
                  <dd>
                    {service.name[locale]}, {formatDuration(booking.serviceMinutes, locale)}
                    {booking.addOnIds.length > 0 && (
                      <span className="block text-muted-foreground">
                        {t.confirmation.plus(booking.addOnIds.map((id) => getAddOn(id)?.name[locale] ?? ""))}
                      </span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">{t.sheet.when}</dt>
                  <dd className="tabular-nums">
                    {formatLongDate(booking.date, locale)}
                    <br />
                    {formatTimeRange(booking.start, booking.duration)}
                  </dd>
                  <dt className="text-muted-foreground">{t.sheet.therapist}</dt>
                  <dd className="flex items-center gap-2">
                    <TherapistAvatar therapist={therapist} size="sm" locale={locale} />
                    {t.team.call(therapist.name[locale])}
                  </dd>
                </dl>
                <Separator />
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">{t.sheet.email}</dt>
                  <dd className="break-all">
                    <a className="hover:underline" href={`mailto:${booking.guest.email}`}>
                      {booking.guest.email}
                    </a>
                  </dd>
                  <dt className="text-muted-foreground">{t.sheet.phone}</dt>
                  <dd>
                    <a className="hover:underline" href={`tel:${booking.guest.phone.replace(/[^\d+]/g, "")}`}>
                      {booking.guest.phone}
                    </a>
                  </dd>
                  {booking.notes && (
                    <>
                      <dt className="text-muted-foreground">{t.sheet.notes}</dt>
                      <dd className="break-words">{booking.notes}</dd>
                    </>
                  )}
                </dl>
                <Separator />
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">{t.sheet.total}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatBaht(booking.total)}
                    {booking.promoCode && <span className="font-normal text-muted-foreground">{t.sheet.withCode(booking.promoCode)}</span>}
                  </dd>
                  <dt className="text-muted-foreground">{t.sheet.payment}</dt>
                  <dd className="tabular-nums">
                    {booking.payment.status === "paid" && t.sheet.paidFull(t.method[booking.payment.method])}
                    {booking.payment.status === "deposit" &&
                      t.sheet.deposit(formatBaht(booking.payment.amountPaid), t.method[booking.payment.method])}
                    {booking.payment.status === "unpaid" && t.sheet.unpaid}
                    {booking.payment.status === "refunded" && t.sheet.refunded}
                  </dd>
                </dl>
              </div>

              <SheetFooter className="gap-2">
                {transitions.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t.sheet.closed}</p>
                )}
                {transitions
                  .filter((status) => status !== "cancelled")
                  .map((status) => (
                    <Button key={status} variant={status === "no-show" ? "outline" : "default"} onClick={() => change(booking, status)}>
                      {t.sheet.actions[status]}
                    </Button>
                  ))}
                {transitions.includes("cancelled") && (
                  <Button variant="destructive" onClick={() => setConfirmCancel(true)}>
                    {t.sheet.actions.cancelled}
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.sheet.cancelTitle(booking?.guest.name.split(" ")[0] ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>{t.sheet.cancelBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.sheet.keep}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (booking) change(booking, "cancelled")
              }}
            >
              {t.sheet.actions.cancelled}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
