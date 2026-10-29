import type { Metadata } from "next"
import { Checkout } from "@/features/shop/components/checkout/checkout"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/checkout">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ชำระเงิน" : "Checkout", robots: { index: false } }
}

export default function CheckoutPage() {
  return <Checkout />
}
