import type { Metadata } from "next"
import { SkipLink } from "@/components/skip-link"
import { ShopAdminShell } from "@/features/shop/components/admin/shop-admin-shell"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/shop/admin">): Promise<Metadata> {
  const { lang } = await params
  const suffix = lang === "th" ? "Kaffa Roasters หลังร้าน" : "Kaffa Roasters admin"
  return { title: { template: `%s | ${suffix}`, default: suffix }, robots: { index: false } }
}

export default async function ShopAdminLayout({ children, params }: LayoutProps<"/[lang]/shop/admin">) {
  const { lang } = await params
  return (
    <>
      <SkipLink label={lang === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <ShopAdminShell>{children}</ShopAdminShell>
    </>
  )
}
