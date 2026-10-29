"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"
import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { formatBaht } from "../../lib/format"
import {
  BOOKING_STEPS,
  completedSteps,
  createBookingFromDraft,
  draftQuote,
  isStepId,
  parsePrefill,
  resolveStep,
  stepIndex,
  type StepId,
} from "../../lib/booking-flow"
import { getTherapist } from "../../data/therapists"
import { toSpaTime } from "../../lib/time"
import { usePersistHydrated, useSpaData } from "../../hooks/use-spa-data"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { useBookingDraft } from "../../store/booking-draft-store"
import { useBookingsStore } from "../../store/bookings-store"
import { BookingSummary } from "./booking-summary"
import { DETAILS_FORM_ID, DetailsStep } from "./details-step"
import { PaymentStep } from "./payment-step"
import { Stepper } from "./stepper"
import { TimeStep } from "./time-step"
import { TreatmentStep } from "./treatment-step"

/** How long the payment check spinner shows before the booking is confirmed. */
export const PAYMENT_CHECK_MS = 1200

function useDraftHydrated() {
  return usePersistHydrated(useBookingDraft.persist)
}

export function BookingWizard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const data = useSpaData()
  const { t, href } = useSpaI18n()
  const draftHydrated = useDraftHydrated()
  const draft = useBookingDraft()
  const addBooking = useBookingsStore((state) => state.addBooking)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const prefillDone = useRef(false)
  const previousStep = useRef<StepId | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // Apply "Book this time" / "Book with Nok" links once, then clean the URL.
  useEffect(() => {
    if (!draftHydrated || prefillDone.current) return
    prefillDone.current = true
    const patch = parsePrefill({
      service: searchParams.get("service"),
      minutes: searchParams.get("minutes"),
      therapist: searchParams.get("therapist"),
      date: searchParams.get("date"),
      time: searchParams.get("time"),
    })
    if (Object.keys(patch).length === 0) return
    const therapist = patch.therapist ? getTherapist(patch.therapist) : undefined
    const serviceId = patch.serviceId ?? useBookingDraft.getState().serviceId
    // A therapist link plus a treatment they don't offer: keep the treatment.
    if (therapist && serviceId && !therapist.skills.includes(serviceId)) patch.therapist = "any"
    useBookingDraft.setState({ ...patch, ...(patch.serviceId && !patch.start ? { start: null } : {}) })
    const target: StepId = patch.serviceId ? "time" : "treatment"
    router.replace(`${pathname}?step=${target}`, { scroll: false })
  }, [draftHydrated, searchParams, pathname, router])

  const requested = searchParams.get("step")
  const quote = draftQuote(draft)
  const ready = data.ready && draftHydrated
  const completed = ready ? completedSteps(draft, data.bookings, data.now) : null
  const step: StepId = completed ? resolveStep(isStepId(requested) ? requested : "treatment", completed) : "treatment"

  // Move focus to the step heading when the step changes, for keyboard and screen reader users.
  useEffect(() => {
    if (!ready) return
    if (previousStep.current && previousStep.current !== step) {
      headingRef.current?.focus({ preventScroll: true })
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
    previousStep.current = step
  }, [step, ready])

  if (!ready || !completed) return <WizardSkeleton />

  const index = stepIndex(step)

  function goTo(next: StepId) {
    setStepError(null)
    router.push(`${pathname}?step=${next}`, { scroll: false })
  }

  function goNext() {
    if (step === "treatment") {
      if (!completed!.treatment) return setStepError(t.steps.needTreatment)
      return goTo("time")
    }
    if (step === "time") {
      if (!completed!.time) return setStepError(t.steps.needTime)
      return goTo("details")
    }
  }

  async function confirm() {
    if (!data.ready) return
    setSubmitting(true)
    if (draft.payment === "promptpay") await new Promise((resolve) => setTimeout(resolve, PAYMENT_CHECK_MS))
    const instant = new Date()
    const result = createBookingFromDraft({
      draft: useBookingDraft.getState(),
      bookings: data.bookings,
      now: toSpaTime(instant),
      instant,
    })
    if (!result.ok) {
      setSubmitting(false)
      if (result.reason === "slot-taken") {
        toast.error(t.steps.slotTaken)
        goTo("time")
      } else {
        toast.error(t.steps.incomplete)
      }
      return
    }
    addBooking(result.booking)
    // The confirmation page clears the draft; resetting here would flash step one.
    router.push(href(`/spa/book/confirmed?ref=${result.booking.reference}`))
  }

  const primaryLabel =
    step === "payment"
      ? draft.payment === "promptpay"
        ? submitting
          ? t.steps.checking
          : t.steps.paid
        : submitting
          ? t.steps.confirming
          : t.steps.confirm
      : t.steps.continue

  const primaryButton =
    step === "details" ? (
      <Button type="submit" form={DETAILS_FORM_ID} size="xl" className="flex-1 sm:flex-none">
        {t.steps.continue}
      </Button>
    ) : (
      <Button
        size="xl"
        className="flex-1 sm:flex-none"
        onClick={step === "payment" ? confirm : goNext}
        disabled={submitting}
        data-testid="wizard-primary"
      >
        {submitting && <Spinner data-icon="inline-start" />}
        {primaryLabel}
      </Button>
    )

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-8 pb-32 sm:px-6 lg:grid-cols-[1fr_22rem] lg:pb-16">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-6">
          <Stepper current={step} completed={completed} onNavigate={goTo} />
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {t.steps.stepOf(index + 1, BOOKING_STEPS.length)}
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="scroll-mt-24 font-heading text-4xl outline-none sm:text-5xl">
              <Phrased text={t.steps.titles[step]} />
            </h1>
          </div>
        </div>

        {step === "treatment" && <TreatmentStep />}
        {step === "time" && quote && <TimeStep bookings={data.bookings} now={data.now} duration={quote.duration} />}
        {step === "details" && <DetailsStep subtotal={quote?.subtotal ?? 0} date={draft.date} onComplete={() => goTo("payment")} />}
        {step === "payment" && quote && <PaymentStep quote={quote} />}

        {stepError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {stepError}
          </p>
        )}

        {/* Step actions: sticky on mobile with the running total, inline on desktop. */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            {index > 0 && (
              <Button variant="outline" size="xl" onClick={() => goTo(BOOKING_STEPS[index - 1].id)} disabled={submitting}>
                <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                {t.steps.back}
              </Button>
            )}
            {quote && (
              <p className="ml-auto text-right text-sm lg:hidden">
                <span className="block text-xs text-muted-foreground">{t.steps.total}</span>
                <span className="font-medium tabular-nums">{formatBaht(quote.total)}</span>
              </p>
            )}
            <div className="flex flex-1 justify-end lg:flex-none">{primaryButton}</div>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <BookingSummary draft={draft} quote={quote} />
        </div>
      </aside>
    </div>
  )
}

export function WizardSkeleton() {
  const { t } = useSpaI18n()
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1fr_22rem]" aria-busy="true">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-12 w-72" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="hidden h-80 lg:block" />
      <span className="sr-only">{t.steps.loading}</span>
    </div>
  )
}
