import type { Metadata } from "next"
import { GiftShop } from "@/features/spa/components/gift/gift-shop"
import { spaMessages } from "@/features/spa/i18n/messages"
import { isLocale } from "@/i18n/config"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/gift">): Promise<Metadata> {
  const { lang } = await params
  const t = spaMessages[isLocale(lang) ? lang : "en"].gift
  return { title: t.metaTitle, description: t.intro }
}

export default function GiftPage() {
  return <GiftShop />
}
