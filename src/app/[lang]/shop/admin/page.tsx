import type { Metadata } from "next"
import { ShopOverview } from "@/features/shop/components/admin/shop-overview"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/admin">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ภาพรวม" : "Overview" }
}

export default function ShopAdminPage() {
  return <ShopOverview />
}
