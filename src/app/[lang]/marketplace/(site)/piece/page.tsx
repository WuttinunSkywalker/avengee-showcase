import type { Metadata } from "next"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LocalPiece } from "@/features/marketplace/components/local-piece"

// New pieces live only in the browser they were listed from, so search engines never see them.
export const metadata: Metadata = { robots: { index: false } }

export default function LocalPiecePage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-10 h-[32rem] w-full max-w-6xl" />}>
      <LocalPiece />
    </Suspense>
  )
}
