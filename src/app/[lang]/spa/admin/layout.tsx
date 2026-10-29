import type { Metadata } from "next"
import { SkipLink } from "@/components/skip-link"
import { AdminShell } from "@/features/spa/components/admin/admin-shell"

export async function generateMetadata({ params }: LayoutProps<"/[lang]/spa/admin">): Promise<Metadata> {
  const { lang } = await params
  const suffix = lang === "th" ? "บ้านละไม หลังร้าน" : "Baan Lamai admin"
  return {
    title: { template: `%s | ${suffix}`, default: suffix },
    robots: { index: false },
  }
}

export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/spa/admin">) {
  const { lang } = await params
  return (
    <>
      <SkipLink label={lang === "th" ? "ข้ามไปที่เนื้อหา" : "Skip to content"} />
      <AdminShell>{children}</AdminShell>
    </>
  )
}
