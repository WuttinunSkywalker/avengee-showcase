import type { MetadataRoute } from "next"
import { site } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/en/spa/admin", "/th/spa/admin", "/en/shop/admin", "/th/shop/admin", "/en/restaurant/kitchen", "/th/restaurant/kitchen", "/en/spa/book/confirmed", "/th/spa/book/confirmed", "/en/og", "/th/og"] },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
