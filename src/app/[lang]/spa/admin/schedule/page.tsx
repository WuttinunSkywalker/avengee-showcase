import type { Metadata } from "next"
import { Suspense } from "react"
import { WeekSchedule } from "@/features/spa/components/admin/week-schedule"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/admin/schedule">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ตารางงานรายสัปดาห์" : "Week schedule" }
}

export default function AdminSchedulePage() {
  return (
    <Suspense>
      <WeekSchedule />
    </Suspense>
  )
}
