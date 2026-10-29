import type { Metadata } from "next"
import { Suspense } from "react"
import { BookingsTable } from "@/features/spa/components/admin/bookings-table"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/admin/bookings">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "การจอง" : "Bookings" }
}

export default function AdminBookingsPage() {
  return (
    <Suspense>
      <BookingsTable />
    </Suspense>
  )
}
