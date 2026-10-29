export const locales = ["en", "th"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export const localeLabels: Record<Locale, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  th: { short: "TH", name: "ไทย" },
}

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}

/** A string in every supported language. */
export type Localized<T = string> = Record<Locale, T>

export function pickLocale<T>(value: Localized<T>, locale: Locale): T {
  return value[locale]
}

/** Prefixes an app path with the locale: localePath("th", "/spa/book") → "/th/spa/book". */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`
}

/** Swaps the locale segment of a pathname, keeping the rest. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/")
  if (isLocale(segments[1])) segments[1] = locale
  else segments.splice(1, 0, locale)
  return segments.join("/") || `/${locale}`
}

/** Picks the best supported locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";")
      const q = params.find((p) => p.trim().startsWith("q="))
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 }
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
  for (const { tag } of ranked) {
    const base = tag.split("-")[0]
    if (isLocale(base)) return base
  }
  return defaultLocale
}
