import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { items } from "@/features/marketplace/data/items"
import { sellers } from "@/features/marketplace/data/sellers"
import { products } from "@/features/shop/data/products"
import { proxy } from "@/proxy"

const request = (path: string, language = "en-US,en;q=0.9") =>
  new NextRequest(new URL(path, "https://avengee.example"), { headers: { "accept-language": language } })

describe("proxy", () => {
  it("lets every listed coffee through, in both languages", () => {
    for (const product of products) {
      for (const lang of ["en", "th"]) {
        const response = proxy(request(`/${lang}/shop/coffee/${product.id}`))
        expect(response.status, product.id).toBe(200)
        expect(response.headers.get("x-middleware-rewrite")).toBeNull()
      }
    }
  })

  it("answers unknown coffees and extra path segments with a 404 page", () => {
    for (const path of ["/en/shop/coffee/blue-mountain", "/th/shop/coffee/doi-chang-washed/extra"]) {
      const response = proxy(request(path))
      expect(response.status, path).toBe(404)
      expect(response.headers.get("x-middleware-rewrite")).toMatch(/\/(en|th)\/unknown-product$/)
    }
  })

  it("does the same for Talad's pieces and dealers", () => {
    for (const item of items) expect(proxy(request(`/th/marketplace/items/${item.id}`)).status, item.id).toBe(200)
    for (const seller of sellers) expect(proxy(request(`/en/marketplace/dealers/${seller.id}`)).status, seller.id).toBe(200)
    for (const path of ["/en/marketplace/items/ming-vase", "/th/marketplace/dealers/nobody", "/en/marketplace/items/bencharong-bowl/extra"]) {
      expect(proxy(request(path)).status, path).toBe(404)
    }
  })

  it("leaves the catalogue and other apps alone", () => {
    for (const path of ["/en/shop/coffee", "/th/spa/book", "/en/shop/admin/orders", "/en/marketplace", "/th/marketplace?q=jar"]) {
      expect(proxy(request(path)).status, path).toBe(200)
    }
  })

  it("sends bare URLs to the visitor's language", () => {
    expect(proxy(request("/", "th-TH,th;q=0.9")).headers.get("location")).toBe("https://avengee.example/th")
    expect(proxy(request("/shop/coffee?roast=light", "en-GB")).headers.get("location")).toBe("https://avengee.example/en/shop/coffee?roast=light")
  })
})
