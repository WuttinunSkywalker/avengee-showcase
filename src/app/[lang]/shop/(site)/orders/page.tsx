import type { Metadata } from "next"
import { OrderList } from "@/features/shop/components/checkout/order-list"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/orders">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "คำสั่งซื้อของคุณ" : "Your orders", robots: { index: false } }
}

export default function OrdersPage() {
  return <OrderList />
}
