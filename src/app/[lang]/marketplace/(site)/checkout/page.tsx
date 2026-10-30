import type { Metadata } from "next"
import { Checkout } from "@/features/marketplace/components/checkout"

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/checkout">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ชำระเงิน" : "Check out", robots: { index: false } }
}

export default function CheckoutPage() {
  return <Checkout />
}
