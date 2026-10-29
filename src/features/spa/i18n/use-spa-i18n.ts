"use client"

import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { spaMessages } from "./messages"

/** Locale, messages and a locale-aware path helper for Baan Lamai client components. */
export function useSpaI18n() {
  const locale = useLocale()
  return { locale, t: spaMessages[locale], href: (path: string) => localePath(locale, path) }
}
