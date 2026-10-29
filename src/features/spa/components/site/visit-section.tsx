import { ExternalLinkIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/i18n/config"
import { spa } from "../../data/spa"
import { spaMessages } from "../../i18n/messages"
import { formatMinutes } from "../../lib/time"

export function VisitSection({ locale }: { locale: Locale }) {
  const t = spaMessages[locale].visit
  return (
    <section id="visit" aria-labelledby="visit-title" className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col gap-6">
          <h2 id="visit-title" className="font-heading text-4xl sm:text-5xl">
            {t.title}
          </h2>
          <address className="text-lg leading-relaxed not-italic">
            {spa.fullName[locale]}
            <br />
            {spa.address.line1[locale]} {spa.address.line2[locale]}
            <br />
            {spa.address.city[locale]}
          </address>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t.hours}</dt>
              <dd className="font-medium tabular-nums">{t.everyDay(formatMinutes(spa.hours.open), formatMinutes(spa.hours.close))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.bts}</dt>
              <dd className="font-medium">{spa.address.transit[locale]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.phone}</dt>
              <dd>
                <a className="font-medium hover:underline" href={spa.phoneHref}>
                  {spa.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.line}</dt>
              <dd className="font-medium" translate="no">
                {spa.lineId}
              </dd>
            </div>
          </dl>
          <div>
            <Button asChild variant="outline" size="lg">
              <a href={spa.address.mapsUrl} target="_blank" rel="noreferrer">
                {t.maps}
                <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-heading text-2xl">{t.before}</h3>
          <Accordion type="single" collapsible className="w-full">
            {t.faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
