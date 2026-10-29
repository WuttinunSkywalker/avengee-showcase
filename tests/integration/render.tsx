import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Locale } from "@/i18n/config"
import { LocaleProvider } from "@/i18n/locale-provider"

export function renderWithLocale(ui: ReactElement, locale: Locale = "en") {
  return render(
    <LocaleProvider locale={locale}>
      <TooltipProvider>{ui}</TooltipProvider>
    </LocaleProvider>,
  )
}
