import type { Metadata } from "next"
import { Suspense } from "react"
import { SkipLink } from "@/components/skip-link"
import { Skeleton } from "@/components/ui/skeleton"
import { SellerCentre } from "@/features/marketplace/components/seller-centre"

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/seller">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ศูนย์ร้านค้า" : "Seller Centre", robots: { index: false } }
}

export default async function SellerCentrePage({ params }: PageProps<"/[lang]/marketplace/seller">) {
  const { lang } = await params
  return (
    <>
      <SkipLink label={lang === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <Suspense fallback={<Skeleton className="m-6 h-96" />}>
        <SellerCentre />
      </Suspense>
    </>
  )
}
