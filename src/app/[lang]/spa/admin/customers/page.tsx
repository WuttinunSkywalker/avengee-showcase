import type { Metadata } from "next"
import { Suspense } from "react"
import { Customers } from "@/features/spa/components/admin/customers"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/admin/customers">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ลูกค้า" : "Customers" }
}

export default function AdminCustomersPage() {
  return (
    <Suspense>
      <Customers />
    </Suspense>
  )
}
