import type { Metadata } from "next"
import { ShopInventory } from "@/features/shop/components/admin/shop-inventory"

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/admin/inventory">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "สต็อกสินค้า" : "Inventory" }
}

export default function ShopAdminInventoryPage() {
  return <ShopInventory />
}
