import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { therapists } from "../../data/therapists"
import { spaMessages } from "../../i18n/messages"
import { formatNumber } from "../../lib/format"
import { Stars, TherapistAvatar } from "../shared"

export function TherapistGrid({ locale }: { locale: Locale }) {
  const t = spaMessages[locale].team
  return (
    <section id="therapists" aria-labelledby="therapists-title">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 id="therapists-title" className="font-heading text-4xl sm:text-5xl">
            {t.title}
          </h2>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((therapist) => (
            <li key={therapist.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <TherapistAvatar therapist={therapist} size="lg" locale={locale} />
                <div className="flex min-w-0 flex-col">
                  <h3 className="font-heading text-2xl">{t.call(therapist.name[locale])}</h3>
                  <p className="text-sm text-muted-foreground">{t.experience(therapist.title[locale], therapist.yearsExperience)}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{therapist.bio[locale]}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <Stars rating={therapist.rating} locale={locale} />
                  <span className="text-muted-foreground tabular-nums">
                    {therapist.rating} ({formatNumber(therapist.reviewCount)})
                  </span>
                </span>
                <Link
                  href={localePath(locale, `/spa/book?therapist=${therapist.id}`)}
                  className="rounded-sm font-medium text-celadon-deep underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-celadon"
                >
                  {t.bookWith(therapist.name[locale])}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{t.speaks(therapist.languages[locale])}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
