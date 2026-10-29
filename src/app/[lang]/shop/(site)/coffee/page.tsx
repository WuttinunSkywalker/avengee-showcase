import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { isLocale } from "@/i18n/config"
import { Catalog } from "@/features/shop/components/catalog/catalog"
import { CatalogFallback } from "@/features/shop/components/catalog/catalog-fallback"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/coffee">): Promise<Metadata> {
  const { lang } = await params
  return lang === "th"
    ? { title: "กาแฟทั้งหมด", description: "เมล็ดกาแฟคั่วสดจากดอยภาคเหนือ กรองตามระดับการคั่ว วิธีแปรรูป และจังหวัดได้" }
    : { title: "All coffee", description: "Freshly roasted coffee from northern Thai farms. Filter by roast, process and province." }
}

export default async function CoffeePage({ params }: PageProps<"/[lang]/shop/coffee">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <Suspense fallback={<CatalogFallback locale={lang} />}>
      <Catalog />
    </Suspense>
  )
}
