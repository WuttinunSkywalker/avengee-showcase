import { notFound } from "next/navigation"
import { isLocale } from "@/i18n/config"
import { CafeSection, CoffeeGrid, FarmsSection, ShopHero } from "@/features/shop/components/site/home-sections"

export default async function ShopHomePage({ params }: PageProps<"/[lang]/shop">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <>
      <ShopHero locale={lang} />
      <CoffeeGrid locale={lang} />
      <FarmsSection locale={lang} />
      <CafeSection locale={lang} />
    </>
  )
}
