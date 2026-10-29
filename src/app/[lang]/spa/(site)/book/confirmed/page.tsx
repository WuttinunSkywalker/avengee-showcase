import type { Metadata } from "next"
import { Suspense } from "react"
import { Confirmation } from "@/features/spa/components/booking/confirmation"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/book/confirmed">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "จองสำเร็จ" : "Booking confirmed", robots: { index: false } }
}

export default function ConfirmedPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  )
}
