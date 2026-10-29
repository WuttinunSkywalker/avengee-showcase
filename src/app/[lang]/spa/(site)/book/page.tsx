import type { Metadata } from "next"
import { Suspense } from "react"
import { BookingWizard, WizardSkeleton } from "@/features/spa/components/booking/booking-wizard"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/book">): Promise<Metadata> {
  const { lang } = await params
  return lang === "th"
    ? { title: "จองคิวนวด", description: "เลือกเมนูนวด หมอนวด และเวลาที่สะดวก แล้วยืนยันด้วยมัดจำผ่านพร้อมเพย์" }
    : { title: "Book a treatment", description: "Choose a treatment, therapist and time, then confirm with a PromptPay deposit." }
}

export default function BookPage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <BookingWizard />
    </Suspense>
  )
}
