import type { Locale } from "@/i18n/config"
import { getService } from "../../data/services"
import { averageRating, reviews } from "../../data/reviews"
import { getTherapist } from "../../data/therapists"
import { spaMessages } from "../../i18n/messages"
import { Stars } from "../shared"

export function ReviewsSection({ locale }: { locale: Locale }) {
  const t = spaMessages[locale]
  // Lead with a review written in the visitor's language.
  const featured = reviews.find((review) => review.lang === locale) ?? reviews[0]
  const rest = reviews.filter((review) => review.id !== featured.id).slice(0, 3)
  const therapistName = (id: string) => {
    const therapist = getTherapist(id)
    return therapist ? t.team.call(therapist.name[locale]) : ""
  }

  return (
    <section aria-labelledby="reviews-title" className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 id="reviews-title" className="font-heading text-4xl sm:text-5xl">
            {t.reviews.title}
          </h2>
          <p className="text-sm opacity-80">{t.reviews.average(averageRating(), reviews.length)}</p>
        </div>

        <figure className="flex max-w-4xl flex-col gap-6">
          <blockquote lang={featured.lang} className="font-heading text-2xl leading-snug sm:text-3xl">
            “{featured.body}”
          </blockquote>
          <figcaption className="text-sm opacity-80">
            {t.reviews.caption(
              featured.author,
              featured.origin[locale],
              getService(featured.serviceId)?.name[locale] ?? "",
              therapistName(featured.therapistId),
            )}
          </figcaption>
        </figure>

        <ul className="grid gap-8 border-t border-primary-foreground/20 pt-10 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((review) => (
            <li key={review.id}>
              <figure className="flex flex-col gap-3">
                <Stars rating={review.rating} locale={locale} />
                <blockquote lang={review.lang} className="leading-relaxed">
                  “{review.body}”
                </blockquote>
                <figcaption className="text-sm opacity-75">
                  {review.author}, {review.origin[locale]}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
