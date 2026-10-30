import type { MetadataRoute } from "next"
import { site } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/en/spa/admin", "/th/spa/admin", "/en/shop/admin", "/th/shop/admin", "/en/restaurant/kitchen", "/th/restaurant/kitchen", "/en/marketplace/checkout", "/th/marketplace/checkout", "/en/marketplace/order", "/th/marketplace/order", "/en/marketplace/orders", "/th/marketplace/orders", "/en/marketplace/seller", "/th/marketplace/seller", "/en/studio/inbox", "/th/studio/inbox", "/en/spa/book/confirmed", "/th/spa/book/confirmed", "/en/spa/book/manage", "/th/spa/book/manage", "/en/og", "/th/og"] },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
