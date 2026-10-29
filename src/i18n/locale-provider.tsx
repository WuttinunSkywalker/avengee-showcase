"use client"

import { createContext, useContext } from "react"
import { defaultLocale, localePath, type Locale } from "./config"

const LocaleContext = createContext<Locale>(defaultLocale)

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** Returns a helper that prefixes paths with the current locale. */
export function useLocalePath() {
  const locale = useLocale()
  return (path: string) => localePath(locale, path)
}
