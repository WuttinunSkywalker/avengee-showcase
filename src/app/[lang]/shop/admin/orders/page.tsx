import type { Metadata } from "next"
import { Suspense } from "react"
import { ShopOrders } from "@/features/shop/components/admin/shop-orders"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/admin/orders">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "คำสั่งซื้อ" : "Orders" }
}

export default function ShopAdminOrdersPage() {
  return (
    <Suspense>
      <ShopOrders />
    </Suspense>
  )
}
