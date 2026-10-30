import type { Metadata } from "next"
import { Suspense } from "react"
import { ManageBooking } from "@/features/spa/components/booking/manage-booking"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/book/manage">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "จัดการการจอง" : "Manage your booking", robots: { index: false } }
}

export default function ManageBookingPage() {
  return (
    <Suspense>
      <ManageBooking />
    </Suspense>
  )
}
