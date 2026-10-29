import { notFound } from "next/navigation"
import { isLocale } from "@/i18n/config"
import { Hero } from "@/features/spa/components/site/hero"
import { ReviewsSection } from "@/features/spa/components/site/reviews-section"
import { TherapistGrid } from "@/features/spa/components/site/therapist-grid"
import { TreatmentMenu } from "@/features/spa/components/site/treatment-menu"
import { VisitSection } from "@/features/spa/components/site/visit-section"

export default async function SpaHomePage({ params }: PageProps<"/[lang]/spa">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <>
      <Hero locale={lang} />
      <TreatmentMenu />
      <TherapistGrid locale={lang} />
      <ReviewsSection locale={lang} />
      <VisitSection locale={lang} />
    </>
  )
}
