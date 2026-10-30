import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import {
  Anuphan,
  Archivo,
  Bai_Jamjuree,
  Bricolage_Grotesque,
  Chonburi,
  Figtree,
  Geist,
  IBM_Plex_Sans_Thai,
  IBM_Plex_Sans_Thai_Looped,
  Instrument_Sans,
  Kanit,
  Manrope,
  Mitr,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
  Sarabun,
  Young_Serif,
} from "next/font/google"
import { HydrationMarker } from "@/components/hydration-marker"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site } from "@/config/site"
import { isLocale, locales } from "@/i18n/config"
import { LocaleProvider } from "@/i18n/locale-provider"
import "../globals.css"

// Portal fonts (preloaded). Each app maps these variables to its own type
// roles in globals.css, so one root layout can serve every showcase.
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" })
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" })
const anuphan = Anuphan({ variable: "--font-anuphan", subsets: ["thai"], display: "swap" })

// App fonts load on demand: only pages that use them download the files.
const youngSerif = Young_Serif({ variable: "--font-young-serif", weight: "400", subsets: ["latin"], display: "swap", preload: false })
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap", preload: false })
const notoSerifThai = Noto_Serif_Thai({ variable: "--font-noto-serif-thai", subsets: ["thai"], display: "swap", preload: false })
const plexThaiLooped = IBM_Plex_Sans_Thai_Looped({
  variable: "--font-plex-thai-looped",
  weight: ["400", "500", "600"],
  subsets: ["thai"],
  display: "swap",
  preload: false,
})

// Kaffa Roasters
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"], display: "swap", preload: false })
const instrumentSans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], display: "swap", preload: false })
const kanit = Kanit({ variable: "--font-kanit", weight: ["500", "700"], subsets: ["thai"], display: "swap", preload: false })
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  weight: ["400", "500", "600"],
  subsets: ["thai"],
  display: "swap",
  preload: false,
})

// Sorn Studio
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap", preload: false })
const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  weight: ["300", "400", "500", "600"],
  subsets: ["thai"],
  display: "swap",
  preload: false,
})

// Krua Yai
const mitr = Mitr({ variable: "--font-mitr", weight: ["400", "500", "600"], subsets: ["latin", "thai"], display: "swap", preload: false })
const sarabun = Sarabun({ variable: "--font-sarabun", weight: ["400", "500", "600"], subsets: ["latin", "thai"], display: "swap", preload: false })

// Talad
const chonburi = Chonburi({ variable: "--font-chonburi", weight: "400", subsets: ["latin", "thai"], display: "swap", preload: false })
const notoSansThai = Noto_Sans_Thai({ variable: "--font-noto-sans-thai", subsets: ["latin", "thai"], display: "swap", preload: false })

const fontVariables = [
  bricolage,
  geist,
  anuphan,
  youngSerif,
  figtree,
  notoSerifThai,
  plexThaiLooped,
  archivo,
  instrumentSans,
  kanit,
  plexThai,
  manrope,
  baiJamjuree,
  mitr,
  sarabun,
  chonburi,
  notoSansThai,
]
  .map((font) => font.variable)
  .join(" ")

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  return {
    metadataBase: new URL(site.url),
    alternates: { languages: { en: "/en", th: "/th" } },
    openGraph: { locale: lang === "th" ? "th_TH" : "en_US" },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1324" },
  ],
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  return (
    <html lang={lang} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={lang}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TooltipProvider>
              {children}
              <HydrationMarker />
              <Toaster position="top-center" />
            </TooltipProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
