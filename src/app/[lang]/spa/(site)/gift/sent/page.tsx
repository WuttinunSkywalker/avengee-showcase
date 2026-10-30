import type { Metadata } from "next"
import { Suspense } from "react"
import { GiftSent } from "@/features/spa/components/gift/gift-sent"
import { spaMessages } from "@/features/spa/i18n/messages"
import { isLocale } from "@/i18n/config"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/gift/sent">): Promise<Metadata> {
  const { lang } = await params
  return { title: spaMessages[isLocale(lang) ? lang : "en"].gift.sent.metaTitle, robots: { index: false } }
}

export default function GiftSentPage() {
  return (
    <Suspense>
      <GiftSent />
    </Suspense>
  )
}
