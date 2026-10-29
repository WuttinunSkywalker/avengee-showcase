import type { Metadata } from "next"
import { Overview } from "@/features/spa/components/admin/overview"

export async function generateMetadata({ params }: PageProps<"/[lang]/spa/admin">): Promise<Metadata> {
  const { lang } = await params
  return { title: lang === "th" ? "ภาพรวม" : "Overview" }
}

export default function AdminOverviewPage() {
  return <Overview />
}
