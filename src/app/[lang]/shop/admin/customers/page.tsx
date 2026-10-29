import type { Metadata } from "next"
import { Suspense } from "react"
import { ShopCustomers } from "@/features/shop/components/admin/shop-customers"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/admin/customers">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ลูกค้า" : "Customers" }
}

export default function ShopAdminCustomersPage() {
  return (
    <Suspense>
      <ShopCustomers />
    </Suspense>
  )
}
