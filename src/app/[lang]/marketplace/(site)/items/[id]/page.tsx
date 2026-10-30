import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isLocale, locales } from "@/i18n/config"
import { ItemDetail } from "@/features/marketplace/components/sections"
import { getItem, items } from "@/features/marketplace/data/items"

export function generateStaticParams() {
  return locales.flatMap((lang) => items.map((item) => ({ lang, id: item.id })))
}

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/items/[id]">): Promise<Metadata> {
  const { lang, id } = await params
  const item = getItem(id)
  if (!item || !isLocale(lang)) return {}
  return {
    title: item.name[lang],
    description: item.description[lang],
    alternates: { languages: { en: `/en/marketplace/items/${id}`, th: `/th/marketplace/items/${id}` } },
  }
}

// Every piece is pre-generated; reading params up front lets unknown ids 404 properly.
export const instant = false

export default async function ItemPage({ params }: PageProps<"/[lang]/marketplace/items/[id]">) {
  const { lang, id } = await params
  const item = getItem(id)
  if (!isLocale(lang) || !item) notFound()
  return <ItemDetail item={item} locale={lang} />
}
