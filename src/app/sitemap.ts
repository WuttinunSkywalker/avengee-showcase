import type { MetadataRoute } from "next"
import { showcases, site } from "@/config/site"
import { locales, localePath } from "@/i18n/config"

/** Public pages in both languages, each pointing at its translation. Staff pages are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...showcases.filter((s) => s.status === "live").flatMap((s) => s.pages ?? [])]
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}${localePath(locale, path)}`,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((alt) => [alt, `${site.url}${localePath(alt, path)}`])),
      },
    })),
  )
}
