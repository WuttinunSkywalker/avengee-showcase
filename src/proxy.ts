import { NextResponse, type NextRequest } from "next/server"
import { products } from "@/features/shop/data/products"
import { isLocale, negotiateLocale } from "@/i18n/config"

const productIds = new Set(products.map((product) => product.id))

/**
 * - Sends locale-less URLs to /en/… or /th/… based on the browser's language.
 * - Answers unknown product ids with a real 404. (With Cache Components the
 *   page would stream a prerendered shell first, so its notFound() can't set
 *   the status, and dynamicParams = false isn't available.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split("/")
  const first = segments[1]

  if (isLocale(first)) {
    const [, , app, section, id, extra] = segments
    if (app === "shop" && section === "coffee" && id && (extra !== undefined || !productIds.has(id))) {
      return NextResponse.rewrite(new URL(`/${first}/unknown-product`, request.url), { status: 404 })
    }
    return NextResponse.next()
  }

  const locale = negotiateLocale(request.headers.get("accept-language"))
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next internals, API routes and files with an extension (images, icons, robots.txt…)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
