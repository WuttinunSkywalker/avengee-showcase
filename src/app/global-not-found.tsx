import type { Metadata } from "next"
import Link from "next/link"
import { Anuphan, Bricolage_Grotesque, Geist } from "next/font/google"
import { site } from "@/config/site"
import "./globals.css"

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" })
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" })
const anuphan = Anuphan({ variable: "--font-anuphan", subsets: ["thai"], display: "swap" })

export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
  description: "This page does not exist.",
}

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${anuphan.variable} h-full antialiased`}>
      <body className="flex min-h-full items-center justify-center px-4">
        <main className="flex max-w-md flex-col gap-5">
          <p className="font-heading text-7xl font-semibold tracking-tight text-primary">404</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
          <p className="text-muted-foreground">
            The link may be old, or the address has a typo.
            <br />
            <span lang="th">ไม่พบหน้านี้ ลิงก์อาจเก่าหรือพิมพ์ที่อยู่ผิด</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/en"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Back to {site.name}
            </Link>
            <Link
              href="/th"
              lang="th"
              className="inline-flex h-11 items-center rounded-lg border border-border px-5 font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              กลับหน้าแรก
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
