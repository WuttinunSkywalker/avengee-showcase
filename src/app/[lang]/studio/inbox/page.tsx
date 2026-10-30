import type { Metadata } from "next"
import { Suspense } from "react"
import { SkipLink } from "@/components/skip-link"
import { Skeleton } from "@/components/ui/skeleton"
import { StudioInbox } from "@/features/studio/components/studio-inbox"

export async function generateMetadata({ params }: PageProps<"/[lang]/studio/inbox">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "งานที่ติดต่อเข้ามา" : "Enquiries", robots: { index: false } }
}

export default async function StudioInboxPage({ params }: PageProps<"/[lang]/studio/inbox">) {
  const { lang } = await params
  return (
    <>
      <SkipLink label={lang === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <Suspense fallback={<Skeleton className="m-6 h-96" />}>
        <StudioInbox />
      </Suspense>
    </>
  )
}
