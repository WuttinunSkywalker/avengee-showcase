import type { Metadata } from "next"
import { Suspense } from "react"
import { OrderConfirmation } from "@/features/shop/components/checkout/order-confirmation"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/order">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "คำสั่งซื้อของคุณ" : "Your order", robots: { index: false } }
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderConfirmation />
    </Suspense>
  )
}
