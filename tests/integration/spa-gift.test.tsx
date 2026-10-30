import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { GiftShop } from "@/features/spa/components/gift/gift-shop"
import { VoucherCard } from "@/features/spa/components/gift/voucher-card"
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
