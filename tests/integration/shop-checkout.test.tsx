import { screen, waitFor, within } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CartDrawer } from "@/features/shop/components/cart/cart-drawer"
import { Checkout } from "@/features/shop/components/checkout/checkout"
import { useCartStore } from "@/features/shop/store/cart-store"
import { useOrdersStore } from "@/features/shop/store/orders-store"
import { renderWithLocale } from "./render"

const navigation = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/en/shop/checkout",
  useSearchParams: () => new URLSearchParams(),
}))

/** One 250 g bag of Doi Pangkhon Natural (฿480): below the ฿1,000 free-shipping line. */
function fillCart(quantity = 1) {
  useCartStore.setState({ items: [{ productId: "doi-pangkhon-natural", amount: 250, grind: "whole", quantity }], promoCode: null, open: false })
}

async function fillAddress(user: UserEvent, postcode = "50200") {
  await user.type(screen.getByLabelText("Full name"), "Aiko Mori")
  await user.type(screen.getByLabelText("Email"), "aiko@mail.example")
  await user.type(screen.getByLabelText("Mobile"), "081 234 5678")
  await user.type(screen.getByLabelText("House number, building, street"), "88 Nimmanhaemin Soi 9")
  await user.type(screen.getByLabelText("Sub-district (tambon / khwaeng)"), "Suthep")
  await user.type(screen.getByLabelText("District (amphoe / khet)"), "Mueang Chiang Mai")
  await user.click(screen.getByRole("combobox", { name: "Province" }))
  await user.type(screen.getByPlaceholderText("Search provinces…"), "chiang m")
  await user.click(screen.getByRole("option", { name: "Chiang Mai" }))
  await user.type(screen.getByLabelText("Postcode"), postcode)
}

beforeEach(() => {
  navigation.push.mockClear()
  useOrdersStore.setState({ orders: [] })
  fillCart()
})

describe("Checkout", () => {
  it("lists every missing field when placed empty", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)
    await user.click(await screen.findByRole("button", { name: /^Place Order/ }))

    for (const message of [
      "Enter the name for delivery.",
      "Enter an email like name@example.com.",
      "Enter a Thai mobile number, like 081 234 5678.",
      "Enter the house number and street.",
      "Enter the sub-district.",
      "Enter the district.",
      "Choose a province.",
      "Postcodes have five digits.",
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument()
    }
    expect(screen.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true")
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it("checks the postcode against the province", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)
    await screen.findByRole("button", { name: /^Place Order/ })
    await fillAddress(user, "10110")
    await user.tab()
    expect(await screen.findByText("Postcodes in Chiang Mai start with 50.")).toBeInTheDocument()
  })

  it("adds the carrier's fee to the total", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)
    expect(await screen.findByTestId("checkout-total")).toHaveTextContent("฿540") // ฿480 + Kerry ฿60
    await user.click(screen.getByRole("radio", { name: /Thailand Post EMS/ }))
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("฿520")
  })

  it("formats the card number and refuses real cards", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)
    await user.click(await screen.findByRole("radio", { name: /Credit or debit card/ }))
    const number = screen.getByLabelText("Card number")

    await user.type(number, "4242424242424241")
    await user.tab()
    expect(await screen.findByText("Check the card number. It doesn't look right.")).toBeInTheDocument()

    await user.clear(number)
    await user.type(number, "4111111111111111")
    expect(await screen.findByText("This store takes test cards only. Use 4242 4242 4242 4242.")).toBeInTheDocument()

    await user.clear(number)
    await user.type(number, "4242424242424242")
    expect(number).toHaveValue("4242 4242 4242 4242")
    expect(screen.getByText("Visa", { exact: true })).toBeInTheDocument()
  })

  it("places a card order, keeping only the brand and last four digits", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)
    await screen.findByRole("button", { name: /^Place Order/ })
    await fillAddress(user)
    await user.click(screen.getByRole("radio", { name: /Credit or debit card/ }))
    await user.type(screen.getByLabelText("Card number"), "5555555555554444")
    await user.type(screen.getByLabelText("Name on card"), "AIKO MORI")
    await user.type(screen.getByLabelText("Expiry (MM/YY)"), "1229")
    await user.type(screen.getByRole("textbox", { name: "CVC" }), "123")
    await user.click(screen.getByRole("button", { name: "Place Order, ฿540" }))

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(expect.stringMatching(/^\/en\/shop\/order\?ref=KR-\d{4}-[A-Z2-9]{4}$/)), { timeout: 3000 })
    const [order] = useOrdersStore.getState().orders
    expect(order).toMatchObject({
      payment: { method: "card", brand: "mastercard", last4: "4444" },
      contact: { name: "Aiko Mori" },
      address: { provinceId: "chiang-mai", postcode: "50200" },
      totals: { total: 540 },
    })
    expect(order.paidAt).toBe(order.createdAt)
    expect(localStorage.getItem("kaffa:orders:v2")).not.toContain("5555555555554444")
    expect(useCartStore.getState().items).toEqual([])
  })

  it("speaks Thai, errors included", async () => {
    const user = userEvent.setup()
    renderWithLocale(<Checkout />, "th")
    expect(await screen.findByRole("heading", { level: 1, name: "ชำระเงิน" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^สั่งซื้อ/ }))
    expect(await screen.findByText("กรอกชื่อผู้รับด้วยนะ")).toBeInTheDocument()
    expect(screen.getByLabelText("ชื่อ-นามสกุล")).toHaveAttribute("aria-invalid", "true")
  })

  it("points an empty cart back to the coffee", async () => {
    useCartStore.setState({ items: [] })
    renderWithLocale(<Checkout />)
    expect(await screen.findByText("There's nothing to check out")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse Coffee" })).toHaveAttribute("href", "/en/shop/coffee")
  })
})

describe("CartDrawer", () => {
  async function open(user: UserEvent, name: RegExp | string = /^Cart/) {
    await user.click(await screen.findByRole("button", { name }))
    return screen.getByRole("dialog")
  }

  it("shows the lines, shipping and how far to free shipping", async () => {
    const user = userEvent.setup()
    renderWithLocale(<CartDrawer />)
    const drawer = await open(user, "Cart, 1 item")
    expect(within(drawer).getAllByTestId("cart-line")).toHaveLength(1)
    expect(within(drawer).getByText("Add ฿520 more for free shipping.")).toBeInTheDocument()
    expect(within(drawer).getByTestId("cart-total")).toHaveTextContent("฿540")
    expect(within(drawer).getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/en/shop/checkout")
  })

  it("updates quantities up to free shipping, then empties", async () => {
    const user = userEvent.setup()
    renderWithLocale(<CartDrawer />)
    const drawer = await open(user)
    await user.click(within(drawer).getByRole("button", { name: "Increase quantity" }))
    await user.click(within(drawer).getByRole("button", { name: "Increase quantity" }))
    expect(within(drawer).getByText("You've got free shipping.")).toBeInTheDocument()
    expect(within(drawer).getByTestId("cart-total")).toHaveTextContent("฿1,440")
    expect(useCartStore.getState().items[0].quantity).toBe(3)

    await user.click(within(drawer).getByRole("button", { name: "Remove Doi Pangkhon Natural" }))
    expect(within(drawer).getByText("Your cart is empty")).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it("speaks Thai", async () => {
    const user = userEvent.setup()
    renderWithLocale(<CartDrawer />, "th")
    const drawer = await open(user, /^ตะกร้า/)
    expect(within(drawer).getByRole("heading", { name: "ตะกร้าของคุณ" })).toBeInTheDocument()
  })
})

describe("Checkout stock check", () => {
  it("warns when the shelf runs low, blocks payment, and trims the cart on request", async () => {
    const { useInventoryStore } = await import("@/features/shop/store/inventory-store")
    const { useShopAdminStore } = await import("@/features/shop/store/admin-store")
    useShopAdminStore.setState({ overrides: {} })
    useCartStore.setState({ items: [{ productId: "khun-chang-khian-anaerobic", amount: 250, grind: "whole", quantity: 4 }] })
    // A stocktake found only 2 bags
    useInventoryStore.setState({
      adjustments: [{ id: "count", productId: "khun-chang-khian-anaerobic", amount: 250, kind: "count", delta: -2, note: "", at: "2026-11-04T01:00:00.000Z" }],
    })
    const user = userEvent.setup()
    renderWithLocale(<Checkout />)

    const alert = await screen.findByTestId("stock-shortage")
    expect(alert).toHaveTextContent("Khun Chang Khian Anaerobic, 250 g: 2 left, you have 4")
    expect(screen.getByRole("button", { name: /^Place Order/ })).toBeDisabled()

    await user.click(within(alert).getByRole("button", { name: "Update My Cart" }))
    expect(useCartStore.getState().items[0].quantity).toBe(2)
    await waitFor(() => expect(screen.queryByTestId("stock-shortage")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: /^Place Order/ })).toBeEnabled()
    useInventoryStore.setState({ adjustments: [] })
  })
})
