import type { Metadata } from "next"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderConfirmation } from "@/features/marketplace/components/order-confirmation"

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/order">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ยืนยันคำสั่งซื้อ" : "Your order", robots: { index: false } }
}

export default function OrderPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-12 h-64 w-full max-w-4xl" />}>
      <OrderConfirmation />
    </Suspense>
  )
}
