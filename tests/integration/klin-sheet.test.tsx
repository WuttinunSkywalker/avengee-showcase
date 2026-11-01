import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ScentSheet } from "@/features/klin/components/scent-sheet"
import { letters } from "@/features/klin/lib/engraving"
import { useBagStore } from "@/features/klin/store/bag-store"
import { renderWithLocale } from "./render"

beforeEach(() => useBagStore.setState({ lines: [] }))

describe("Klin scent sheet", () => {
  it("engraves the guest's words, live, and puts them on the bag line", async () => {
    const user = userEvent.setup()
    const onEngrave = vi.fn()
    renderWithLocale(<ScentSheet scentId="monsoon" onEngrave={onEngrave} onClose={() => {}} />)
    const field = screen.getByRole("textbox", { name: "Engraving" })
    expect(screen.getByText("Free, in gold on the glass. 16 letters left.")).toBeInTheDocument()
    await user.type(field, "For  Ploy 🌧️")
    expect(field).toHaveValue("For Ploy ")
    expect(onEngrave).toHaveBeenLastCalledWith("For Ploy")
    expect(screen.getByText("Free, in gold on the glass. 7 letters left.")).toBeInTheDocument()
    expect(screen.getByTestId("sheet-engraving")).toHaveTextContent("KLINFor Ploy")

    await user.click(screen.getByRole("button", { name: "Add to Bag, ฿2,900" }))
    expect(useBagStore.getState().lines).toEqual([{ scentId: "monsoon", ml: 50, quantity: 1, engraving: "For Ploy" }])
  })

  it("stops at sixteen letters, counting Thai marks with their letter", async () => {
    const user = userEvent.setup()
    renderWithLocale(<ScentSheet scentId="jasmine-hour" onClose={() => {}} />, "th")
    const field = screen.getByRole("textbox", { name: "สลักชื่อบนขวด" })
    await user.type(field, "ถึงคุณแม่ที่รักที่สุดในโลก")
    expect(screen.getByText("ฟรี สลักสีทองบนแก้ว เหลืออีก 0 ตัวอักษร")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^ใส่ตะกร้า/ }))
    const engraved = useBagStore.getState().lines[0].engraving!
    expect(letters(engraved)).toHaveLength(16)
    expect("ถึงคุณแม่ที่รักที่สุดในโลก".startsWith(engraved)).toBe(true)
  })
})
