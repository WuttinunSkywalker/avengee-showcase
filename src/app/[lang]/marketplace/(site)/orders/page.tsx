import type { Metadata } from "next"
import { OrderList } from "@/features/marketplace/components/order-list"

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/orders">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ออเดอร์ของฉัน" : "Your orders", robots: { index: false } }
}

export default function OrdersPage() {
  return <OrderList />
}
