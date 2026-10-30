import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BookingSummary } from "@/features/spa/components/booking/booking-summary"
import { DETAILS_FORM_ID, DetailsStep } from "@/features/spa/components/booking/details-step"
import { PaymentStep } from "@/features/spa/components/booking/payment-step"
import { TimeStep } from "@/features/spa/components/booking/time-step"
import { TreatmentStep } from "@/features/spa/components/booking/treatment-step"
import { draftQuote } from "@/features/spa/lib/booking-flow"
import { calculateQuote } from "@/features/spa/lib/pricing"
import { initialDraft, useBookingDraft } from "@/features/spa/store/booking-draft-store"
import { getTherapist } from "@/features/spa/data/therapists"
import { worksOn } from "@/features/spa/lib/availability"
import { addDays, formatLongDate, formatShortDate } from "@/features/spa/lib/time"
import { renderWithLocale } from "./render"

const NOW = { date: "2026-11-04", minutes: 9 * 60 }

beforeEach(() => useBookingDraft.setState(initialDraft))

describe("TreatmentStep", () => {
  it("selects a treatment, its length and add-ons", async () => {
    const user = userEvent.setup()
    renderWithLocale(<TreatmentStep />)

    await user.click(screen.getByRole("radio", { name: /Aromatherapy Oil Massage/ }))
    expect(useBookingDraft.getState()).toMatchObject({ serviceId: "aromatherapy", minutes: 60 })

    await user.click(screen.getByRole("radio", { name: /1 hr 30 min/ }))
    expect(useBookingDraft.getState().minutes).toBe(90)

    await user.click(screen.getByRole("checkbox", { name: /Head and scalp massage/ }))
    expect(useBookingDraft.getState().addOnIds).toEqual(["scalp-massage"])
  })

  it("narrows the list to a chosen therapist's treatments and can reset", async () => {
    const user = userEvent.setup()
    useBookingDraft.setState({ therapist: "lek" })
    renderWithLocale(<TreatmentStep />)
    expect(screen.getAllByRole("radio")).toHaveLength(2)
    await user.click(screen.getByRole("button", { name: "Show all treatments" }))
    expect(screen.getAllByRole("radio")).toHaveLength(7)
  })

  it("renders in Thai", () => {
    renderWithLocale(<TreatmentStep />, "th")
    expect(screen.getByText("เลือกเมนูนวด")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /นวดแผนไทย/ })).toBeInTheDocument()
  })
})

describe("TimeStep", () => {
  it("lists free times and stores the chosen slot", async () => {
    const user = userEvent.setup()
    useBookingDraft.setState({ serviceId: "thai-massage", minutes: 60 })
    renderWithLocale(<TimeStep bookings={[]} now={NOW} duration={60} />)

    expect(screen.getByRole("radio", { name: /^Wednesday 4 November 2026, \d+ times free/ })).toBeInTheDocument()
    const morning = screen.getByRole("radiogroup", { name: "Morning times" })
    await user.click(within(morning).getByRole("radio", { name: "10:00" }))
    expect(useBookingDraft.getState()).toMatchObject({ date: "2026-11-04", start: 600 })
  })

  it("changing the therapist clears the chosen time", async () => {
    const user = userEvent.setup()
    useBookingDraft.setState({ serviceId: "thai-massage", minutes: 60, date: "2026-11-04", start: 600 })
    renderWithLocale(<TimeStep bookings={[]} now={NOW} duration={60} />)
    await user.click(screen.getByRole("radio", { name: /Nok/ }))
    expect(useBookingDraft.getState()).toMatchObject({ therapist: "nok", start: null })
  })

  it("jumps to the next free day from below the times", async () => {
    const user = userEvent.setup()
    useBookingDraft.setState({ serviceId: "thai-massage", minutes: 60, therapist: "nok", date: "2026-11-04" })
    renderWithLocale(<TimeStep bookings={[]} now={NOW} duration={60} />)
    const nok = getTherapist("nok")!
    const expected = Array.from({ length: 13 }, (_, i) => addDays("2026-11-04", i + 1)).find((day) => worksOn(nok, day))!

    expect(screen.getByText("None of these times suit you?")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: `Next free day: ${formatShortDate(expected)}` }))
    expect(useBookingDraft.getState()).toMatchObject({ date: expected, start: null })
    expect(screen.getByRole("radio", { name: new RegExp(`^${formatLongDate(expected)}, \\d+ times free`) })).toHaveAttribute("data-state", "on")
  })

  it("offers the next free day in Thai", () => {
    useBookingDraft.setState({ serviceId: "thai-massage", minutes: 60, date: "2026-11-04" })
    renderWithLocale(<TimeStep bookings={[]} now={NOW} duration={60} />, "th")
    expect(screen.getByText("ยังไม่มีเวลาที่สะดวกใช่ไหมคะ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ดูวันว่างถัดไป พฤ. 5 พ.ย." })).toBeInTheDocument()
  })
})

describe("DetailsStep", () => {
  function renderDetails(locale: "en" | "th" = "en") {
    const onComplete = vi.fn()
    renderWithLocale(
      <>
        <DetailsStep subtotal={1500} date="2026-11-05" onComplete={onComplete} />
        <button type="submit" form={DETAILS_FORM_ID}>
          submit
        </button>
      </>,
      locale,
    )
    return onComplete
  }

  it("blocks submission and explains each problem", async () => {
    const user = userEvent.setup()
    const onComplete = renderDetails()
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(await screen.findByText("Enter your name so your therapist knows who to greet.")).toBeInTheDocument()
    expect(screen.getByText("Accept the cancellation policy to continue.")).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("saves valid details to the draft", async () => {
    const user = userEvent.setup()
    const onComplete = renderDetails()
    await user.type(screen.getByLabelText("Full name"), "Mia Thompson")
    await user.type(screen.getByLabelText("Email"), "mia@mail.example")
    await user.type(screen.getByLabelText("Mobile"), "+61 412 558 903")
    await user.click(screen.getByRole("checkbox", { name: /cancel free of charge/ }))
    await user.click(screen.getByRole("button", { name: "submit" }))
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(useBookingDraft.getState().guest).toMatchObject({ name: "Mia Thompson", email: "mia@mail.example", acceptPolicy: true })
  })

  it("shows Thai validation messages on the Thai site", async () => {
    const user = userEvent.setup()
    renderDetails("th")
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(await screen.findByText("กรอกชื่อด้วยนะคะ หมอนวดจะได้ทักถูกคน")).toBeInTheDocument()
  })

  it("applies and removes a promo code", async () => {
    const user = userEvent.setup()
    renderDetails()
    await user.type(screen.getByRole("textbox", { name: "Promo code" }), "lamai200{Enter}")
    expect(await screen.findByRole("status")).toHaveTextContent("LAMAI200 applied")
    expect(useBookingDraft.getState().promoCode).toBe("LAMAI200")
    await user.click(screen.getByRole("button", { name: "Remove code LAMAI200" }))
    expect(useBookingDraft.getState().promoCode).toBeNull()
  })

  it("explains why a code does not apply", async () => {
    const user = userEvent.setup()
    renderDetails()
    await user.type(screen.getByRole("textbox", { name: "Promo code" }), "WEEKDAY15")
    await user.click(screen.getByRole("button", { name: "Apply" }))
    // 5 Nov 2026 is a Thursday, so WEEKDAY15 is valid
    expect(await screen.findByRole("status")).toHaveTextContent("WEEKDAY15 applied")
  })
})

describe("PaymentStep and summary", () => {
  it("shows the deposit QR and switches to pay at the spa", async () => {
    const user = userEvent.setup()
    const quote = calculateQuote({ serviceId: "thai-massage", minutes: 90 })
    renderWithLocale(<PaymentStep today="2026-11-04" voucher={null} split={null} quote={quote} />)
    expect(screen.getByTestId("deposit-amount")).toHaveTextContent("฿270")
    expect(screen.getByTitle("PromptPay QR code for ฿270")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: /Pay ฿900 at the spa/ }))
    expect(useBookingDraft.getState().payment).toBe("pay-at-spa")
    expect(screen.queryByTitle(/PromptPay QR code/)).not.toBeInTheDocument()
  })

  it("summarises price, add-ons and discount", () => {
    const draft = { ...initialDraft, serviceId: "hot-stone", minutes: 90, addOnIds: ["herbal-steam"], promoCode: "WELCOME10" }
    renderWithLocale(<BookingSummary draft={draft} quote={draftQuote(draft)} />)
    expect(screen.getByText("Hot Stone Massage")).toBeInTheDocument()
    expect(screen.getByText("Herbal steam room")).toBeInTheDocument()
    expect(screen.getByText("Code WELCOME10")).toBeInTheDocument()
    // 1,900 + 350 = 2,250, minus 10% (225) = 2,025
    expect(screen.getByTestId("summary-total")).toHaveTextContent("฿2,025")
  })
})
