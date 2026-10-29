import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ShopOrders } from "@/features/shop/components/admin/shop-orders"
import { PromoField } from "@/features/shop/components/cart/promo-field"
import { TrackingTimeline } from "@/features/shop/components/checkout/tracking-timeline"
import { PurchasePanel } from "@/features/shop/components/product/purchase-panel"
import { getProduct } from "@/features/shop/data/products"
import { fulfilmentStatus, generateShopOrders } from "@/features/shop/lib/admin"
import { trackingTimeline } from "@/features/shop/lib/tracking"
import { useShopAdminStore } from "@/features/shop/store/admin-store"
import { useCartStore } from "@/features/shop/store/cart-store"
import { renderWithLocale } from "./render"

// The orders table reads and writes its state in the URL; let each test set it.
const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), replace: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: navigation.replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/en/shop/admin/orders",
  useSearchParams: () => navigation.params,
}))

const NOW = new Date("2026-11-04T02:00:00Z") // Wed 09:00 Bangkok

beforeEach(() => {
  useCartStore.setState({ items: [], promoCode: null, open: false })
  useShopAdminStore.setState({ overrides: {} })
  navigation.params = new URLSearchParams()
  navigation.replace.mockClear()
})

describe("PurchasePanel", () => {
  it("adds the chosen size, grind and quantity to the cart", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PurchasePanel product={getProduct("doi-pangkhon-natural")!} />)

    await user.click(screen.getByRole("radio", { name: /^1 kg/ }))
    await user.click(screen.getByRole("radio", { name: "Espresso" }))
    await user.click(screen.getByRole("button", { name: "Increase quantity" }))
    expect(screen.getByTestId("quantity")).toHaveTextContent("2")
    expect(screen.getByTestId("product-price")).toHaveTextContent("฿3,300")

    await user.click(screen.getByRole("button", { name: "Add to Cart" }))
    expect(useCartStore.getState().items).toEqual([{ productId: "doi-pangkhon-natural", amount: 1000, grind: "espresso", quantity: 2 }])
    expect(screen.getByTestId("quantity")).toHaveTextContent("1")
  })

  it("caps quantity at the stock left", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PurchasePanel product={getProduct("khun-chang-khian-anaerobic")!} />)
    const increase = screen.getByRole("button", { name: "Increase quantity" })
    for (let i = 0; i < 6; i++) await user.click(increase)
    expect(screen.getByTestId("quantity")).toHaveTextContent("4")
    expect(increase).toBeDisabled()
    expect(screen.getByText(/You can add up to 4\./)).toBeInTheDocument()
  })

  it("blocks a sold-out size", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PurchasePanel product={getProduct("doi-inthanon-washed")!} />)
    await user.click(screen.getByRole("radio", { name: /^500 g.*Sold out$/ }))
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled()
    expect(screen.getByText("Sold out at this size. Try another size.")).toBeInTheDocument()
  })

  it("skips the grind for drip bags and speaks Thai", () => {
    renderWithLocale(<PurchasePanel product={getProduct("drip-bag-sampler")!} />, "th")
    expect(screen.queryByRole("group", { name: "การบด" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ใส่ตะกร้า" })).toBeEnabled()
  })
})

describe("PromoField", () => {
  it("asks for a code before applying", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PromoField subtotal={500} id="promo" />)
    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(screen.getByText("Enter a code first.")).toBeInTheDocument()
  })

  it("explains unknown codes and minimum spends", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PromoField subtotal={500} id="promo" />)
    const input = screen.getByRole("textbox", { name: "Promo code" })
    await user.type(input, "coffee{Enter}")
    expect(screen.getByText(/isn't a valid code/)).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "true")

    await user.clear(input)
    await user.type(input, "kaffa100{Enter}")
    expect(screen.getByText("KAFFA100 needs an order of ฿800 or more.")).toBeInTheDocument()
    expect(useCartStore.getState().promoCode).toBeNull()
  })

  it("applies a code, then removes it", async () => {
    const user = userEvent.setup()
    renderWithLocale(<PromoField subtotal={900} id="promo" />)
    await user.type(screen.getByRole("textbox", { name: "Promo code" }), "firstcup")
    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(screen.getByRole("status")).toHaveTextContent("FIRSTCUP applied")
    expect(useCartStore.getState().promoCode).toBe("FIRSTCUP")

    await user.click(screen.getByRole("button", { name: "Remove code FIRSTCUP" }))
    expect(useCartStore.getState().promoCode).toBeNull()
    expect(screen.getByRole("textbox", { name: "Promo code" })).toBeInTheDocument()
  })

  it("drops back to an error when the cart no longer qualifies", () => {
    useCartStore.setState({ promoCode: "KAFFA100" })
    renderWithLocale(<PromoField subtotal={600} id="promo" />, "th")
    expect(screen.getByText("โค้ด KAFFA100 ใช้ได้เมื่อสั่งครบ ฿800")).toBeInTheDocument()
  })
})

describe("TrackingTimeline", () => {
  const order = { reference: "KR-1104-ABCD", createdAt: "2026-11-04T02:00:00.000Z", paidAt: "2026-11-04T02:00:00.000Z", carrier: "kerry" as const }

  it("marks the current step and shows when later steps are expected", () => {
    renderWithLocale(<TrackingTimeline steps={trackingTimeline(order, new Date("2026-11-04T03:00:00Z"))} waitingForPayment={false} />)
    const list = screen.getByRole("list", { name: "Tracking" })
    const current = within(list).getAllByRole("listitem").find((item) => item.getAttribute("aria-current") === "step")!
    expect(current).toHaveTextContent("Roasting")
    expect(current).toHaveTextContent("Tue 10 Nov 08:00")
    expect(current).toHaveTextContent("Your beans go in the roaster on Tuesday morning.")
  })

  it("waits for a PromptPay transfer, in Thai", () => {
    const unpaid = { ...order, paidAt: null }
    renderWithLocale(<TrackingTimeline steps={trackingTimeline(unpaid, new Date("2026-11-04T03:00:00Z"))} waitingForPayment />, "th")
    const current = screen.getAllByRole("listitem").find((item) => item.getAttribute("aria-current") === "step")!
    expect(current).toHaveTextContent("รอชำระเงิน")
    expect(current).toHaveTextContent("รอยอดโอนผ่านพร้อมเพย์อยู่")
    expect(screen.getByText("ได้รับคำสั่งซื้อ")).toBeInTheDocument()
  })
})

describe("ShopOrders", () => {
  const seeded = generateShopOrders(NOW)
  const toRoast = seeded.filter((order) => fulfilmentStatus(order, NOW) === "to-roast")

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it("lists every seeded order, fifteen at a time", async () => {
    renderWithLocale(<ShopOrders />)
    expect(await screen.findByTestId("orders-count")).toHaveTextContent(`Showing 1–15 of ${seeded.length} orders`)
    expect(screen.getByRole("button", { name: `Open order ${seeded[0].reference}` })).toBeInTheDocument()
  })

  it("filters by the status in the URL", async () => {
    navigation.params = new URLSearchParams({ status: "to-roast" })
    renderWithLocale(<ShopOrders />)
    expect(await screen.findByTestId("orders-count")).toHaveTextContent(`of ${toRoast.length} orders`)
    const rows = screen.getAllByRole("row").slice(1)
    for (const row of rows) expect(within(row).getByText("To roast")).toBeInTheDocument()
  })

  it("moves an order forward from its sheet and closes it", async () => {
    const user = userEvent.setup()
    const reference = toRoast[0].reference
    navigation.params = new URLSearchParams({ order: reference })
    renderWithLocale(<ShopOrders />)

    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByRole("heading", { name: reference })).toBeInTheDocument()
    await user.click(within(sheet).getByRole("button", { name: "Mark Packed" }))
    expect(useShopAdminStore.getState().overrides).toEqual({ [reference]: "ready-to-ship" })
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/en/shop/admin/orders", { scroll: false }))
  })

  it("speaks Thai", async () => {
    renderWithLocale(<ShopOrders />, "th")
    expect(await screen.findByRole("heading", { level: 1, name: "คำสั่งซื้อ" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "สถานะ" })).toBeInTheDocument()
    expect(screen.getByTestId("orders-count")).toHaveTextContent(/^แสดง 1–15 จาก/)
  })
})

describe("orders store upgrade", () => {
  it("moves orders saved by the first version to the current key", async () => {
    const { useOrdersStore } = await import("@/features/shop/store/orders-store")
    const legacy = {
      reference: "KR-1027-H7QP",
      createdAt: "2026-10-27T04:12:00.000Z",
      lines: [{ productId: "drip-bag-sampler", name: "Drip Bag Sampler", amount: 10, grind: null, quantity: 1, unitPrice: 290 }],
      totals: { subtotal: 290, discount: 0, shipping: 60, total: 350 },
      promoCode: null,
      contact: { name: "Aiko Mori", email: "aiko@mail.example", phone: "081 234 5678" },
      address: { line1: "88 Nimmanhaemin Soi 9", line2: "", district: "", provinceId: "chiang-mai", postcode: "50200" },
      carrier: "flash",
      payment: { method: "promptpay" },
    }
    localStorage.setItem("kaffa:orders:v1", JSON.stringify({ state: { orders: [legacy] }, version: 1 }))

    await useOrdersStore.persist.rehydrate()
    expect(useOrdersStore.getState().orders).toMatchObject([{ reference: "KR-1027-H7QP", paidAt: null, lines: [{ kind: "drip-bags" }] }])
    expect(localStorage.getItem("kaffa:orders:v1")).toBeNull()
    expect(JSON.parse(localStorage.getItem("kaffa:orders:v2")!).state.orders).toHaveLength(1)

    // The upgraded order can still be confirmed as paid
    useOrdersStore.getState().markPaid("KR-1027-H7QP", "2026-10-27T04:30:00.000Z")
    expect(useOrdersStore.getState().orders[0].paidAt).toBe("2026-10-27T04:30:00.000Z")
    useOrdersStore.setState({ orders: [] })
  })
})
