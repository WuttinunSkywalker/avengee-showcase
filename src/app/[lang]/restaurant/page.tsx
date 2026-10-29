import { notFound } from "next/navigation"
import { Suspense } from "react"
import { SkipLink } from "@/components/skip-link"
import { Skeleton } from "@/components/ui/skeleton"
import { isLocale } from "@/i18n/config"
import { RestaurantApp } from "@/features/restaurant/components/restaurant-app"
import { RestaurantHeader } from "@/features/restaurant/components/restaurant-header"
import { restaurantMessages } from "@/features/restaurant/i18n/messages"

export default async function RestaurantPage({ params }: PageProps<"/[lang]/restaurant">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <>
      <SkipLink label={restaurantMessages[lang].skip} />
      {/* The table number comes from the QR code's query string, read on the client. */}
      <Suspense
        fallback={
          <>
            <RestaurantHeader locale={lang} />
            <main id="main" className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10" aria-busy="true">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="aspect-[4/3] w-full max-w-lg" />
            </main>
          </>
        }
      >
        <RestaurantApp />
      </Suspense>
    </>
  )
}
