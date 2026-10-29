import type { Metadata } from "next"
import { Suspense } from "react"
import { SkipLink } from "@/components/skip-link"
import { KitchenScreen } from "@/features/restaurant/components/kitchen-screen"

export async function generateMetadata({ params }: PageProps<"/[lang]/restaurant/kitchen">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "จอครัว" : "Kitchen", robots: { index: false } }
}

export default async function KitchenPage({ params }: PageProps<"/[lang]/restaurant/kitchen">) {
  const { lang } = await params
  return (
    <>
      <SkipLink label={lang === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <Suspense>
        <KitchenScreen />
      </Suspense>
    </>
  )
}
