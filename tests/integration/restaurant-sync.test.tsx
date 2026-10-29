import { act, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { useBasketStore } from "@/features/restaurant/store/basket-store"
import { useKitchenStore } from "@/features/restaurant/store/kitchen-store"

function Synced() {
  useStorageSync(useKitchenStore.persist)
  return null
}

const otherTab = (key: string, value: unknown) => {
  const json = JSON.stringify({ state: value, version: 1 })
  localStorage.setItem(key, json)
  window.dispatchEvent(new StorageEvent("storage", { key, newValue: json, storageArea: localStorage }))
}

describe("Krua Yai across tabs", () => {
  it("picks up the kitchen's marks written by another tab", async () => {
    render(<Synced />)
    await act(async () => otherTab("kruayai:kitchen:v1", { overrides: { "here-9-2026-11-04T02:00:00.000Z": "served" } }))
    expect(useKitchenStore.getState().overrides).toEqual({ "here-9-2026-11-04T02:00:00.000Z": "served" })
  })

  it("keeps a table's order between visits only while the visit is going", async () => {
    const saved = { table: 9, lines: [], rounds: [{ number: 1, sentAt: new Date().toISOString(), lines: [] }], calls: {} }
    localStorage.setItem("kruayai:table:v1", JSON.stringify({ state: { ...saved, updatedAt: new Date().toISOString() }, version: 1 }))
    await useBasketStore.persist.rehydrate()
    expect(useBasketStore.getState().rounds).toHaveLength(1)

    useBasketStore.setState({ table: null, rounds: [], updatedAt: null })
    const yesterday = new Date(Date.now() - 20 * 3_600_000).toISOString()
    localStorage.setItem("kruayai:table:v1", JSON.stringify({ state: { ...saved, updatedAt: yesterday }, version: 1 }))
    await useBasketStore.persist.rehydrate()
    expect(useBasketStore.getState()).toMatchObject({ table: null, rounds: [] })
  })
})
