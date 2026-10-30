import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { PaymentStep } from "@/features/spa/components/booking/payment-step"
import { GiftShop } from "@/features/spa/components/gift/gift-shop"
import { VoucherCard } from "@/features/spa/components/gift/voucher-card"
import { calculateQuote } from "@/features/spa/lib/pricing"
import { checkVoucher, issueVoucher, splitWithVoucher } from "@/features/spa/lib/vouchers"
import { initialDraft, useBookingDraft } from "@/features/spa/store/booking-draft-store"
import { useVouchersStore } from "@/features/spa/store/vouchers-store"
import { renderWithLocale } from "./render"

describe("GiftShop", () => {
  it("previews the card as the buyer fills it in", async () => {
    const user = userEvent.setup()
    renderWithLocale(<GiftShop />)
    const card = screen.getByTestId("voucher-card")
    expect(within(card).getByTestId("voucher-amount")).toHaveTextContent("฿2,000")

    await user.click(screen.getByRole("radio", { name: "฿3,000" }))
    await user.click(screen.getByRole("radio", { name: /Indigo/ }))
    await user.type(screen.getByLabelText("Their name"), "Ploy")
    await user.type(screen.getByLabelText("Message on the card"), "Rest well")

    expect(within(card).getByTestId("voucher-amount")).toHaveTextContent("฿3,000")
    expect(card).toHaveAttribute("data-design", "indigo")
    expect(within(card).getByText("For Ploy")).toBeInTheDocument()
    expect(within(card).getByText("Rest well")).toBeInTheDocument()
    expect(screen.getByText("Optional. 191 characters left.")).toBeInTheDocument()
    expect(screen.getByTestId("gift-pay-amount")).toHaveTextContent("฿3,000")
    expect(screen.getByTestId("gift-covers")).toHaveTextContent(/^Enough for /)
  })

  it("asks for the recipient's email only when sending it to them", async () => {
    const user = userEvent.setup()
    renderWithLocale(<GiftShop />)
    expect(screen.queryByLabelText("Their email")).not.toBeInTheDocument()
    await user.type(screen.getByLabelText("Their name"), "Ploy")
    await user.click(screen.getByRole("radio", { name: /Straight to Ploy/ }))
    expect(screen.getByLabelText("Their email")).toBeInTheDocument()
  })

  it("shows what's missing on submit", async () => {
    const user = userEvent.setup()
    renderWithLocale(<GiftShop />)
    await user.click(screen.getByRole("button", { name: "I've Paid, Send the Voucher" }))
    expect(await screen.findByText("Add their name for the card.")).toBeInTheDocument()
    expect(screen.getByText("Add your name so they know who it's from.")).toBeInTheDocument()
    expect(screen.getByText("Enter an email like name@example.com.")).toBeInTheDocument()
  })

  it("speaks Thai", () => {
    renderWithLocale(<GiftShop />, "th")
    expect(screen.getByRole("heading", { level: 1, name: "ให้เขาได้พักสักบ่าย" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "โอนแล้ว ส่งบัตรเลย" })).toBeInTheDocument()
  })
})

describe("VoucherCard", () => {
  it("shows the code and a short Thai expiry once issued", () => {
    renderWithLocale(<VoucherCard design="jasmine" amount={1500} to="พลอย" from="มายด์" message="" code="BLG-7KQ2-M9XD" validUntil="2027-11-04" />, "th")
    expect(screen.getByText("ถึงคุณพลอย")).toBeInTheDocument()
    expect(screen.getByTestId("voucher-code")).toHaveTextContent("BLG-7KQ2-M9XD")
    expect(screen.getByText("ใช้ได้ถึง 4 พ.ย. 2570")).toBeInTheDocument()
  })
})

describe("PaymentStep with a gift voucher", () => {
  const voucher = issueVoucher(
    { amount: 1000, design: "teak", to: "Ploy", from: "Mia", message: "", buyerEmail: "mia@mail.example", delivery: "me", recipientEmail: "" },
    new Date("2026-10-01T03:00:00Z"),
    "2026-10-01",
    [],
  )
  // Thai massage, 90 minutes: ฿900 with a ฿270 deposit
  const quote = calculateQuote({ serviceId: "thai-massage", minutes: 90 })

  beforeEach(() => {
    useBookingDraft.setState(initialDraft)
    useVouchersStore.setState({ issued: [voucher], redemptions: [{ code: voucher.code, amount: 800, bookingReference: "BL-TEST01", at: "2026-10-20T03:00:00Z" }] })
  })

  it("checks the code and stores it on the draft", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PaymentStep quote={quote} today="2026-11-04" voucher={null} split={null} />)
    await user.click(screen.getByRole("button", { name: "Use" }))
    expect(screen.getByText("Enter the code from your voucher first.")).toBeInTheDocument()
    await user.type(screen.getByRole("textbox", { name: "Gift voucher" }), "blg-aaaa-bbbb{Enter}")
    expect(screen.getByText(/We can't find voucher BLG-AAAA-BBBB/)).toBeInTheDocument()
    await user.clear(screen.getByRole("textbox", { name: "Gift voucher" }))
    await user.type(screen.getByRole("textbox", { name: "Gift voucher" }), voucher.code.toLowerCase())
    await user.click(screen.getByRole("button", { name: "Use" }))
    expect(useBookingDraft.getState().voucherCode).toBe(voucher.code)
  })

  it("lowers the deposit when the balance doesn't cover it", () => {
    const check = checkVoucher(voucher.code, [voucher], useVouchersStore.getState().redemptions, "2026-11-04")
    expect(check).toMatchObject({ ok: true, balance: 200 })
    renderWithLocale(<PaymentStep quote={quote} today="2026-11-04" voucher={check} split={splitWithVoucher(quote, 200, true)} />)
    expect(screen.getByTestId("voucher-applied")).toHaveTextContent(`${voucher.code} applied. ฿200 off this booking.`)
    expect(screen.getByRole("radio", { name: /Pay ฿70 deposit now with PromptPay/ })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /Pay ฿700 at the spa/ })).toBeInTheDocument()
    expect(screen.getByTestId("deposit-amount")).toHaveTextContent("฿70")
  })

  it("skips the transfer when the voucher covers the deposit, and keeps the rest on it", () => {
    const check = checkVoucher(voucher.code, [voucher], [], "2026-11-04")
    renderWithLocale(<PaymentStep quote={quote} today="2026-11-04" voucher={check} split={splitWithVoucher(quote, 1000, true)} />, "th")
    expect(screen.getByTestId("voucher-covers")).toHaveTextContent("บัตรของขวัญครอบคลุมยอดทั้งหมดแล้ว")
    expect(screen.getByText("ยอดในบัตรเหลืออีก ฿100 เก็บไว้ใช้ครั้งหน้าได้ค่ะ")).toBeInTheDocument()
    expect(screen.queryByRole("radio")).not.toBeInTheDocument()
  })
})
