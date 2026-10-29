import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MailIcon } from "lucide-react"
import { Phrased } from "@/components/phrased"
import { SkipLink } from "@/components/skip-link"
import { Button } from "@/components/ui/button"
import { site } from "@/config/site"
import { isLocale } from "@/i18n/config"
import { stagger } from "@/lib/motion"
import { portalMessages } from "@/features/portal/messages"
import { HeroShowcase } from "@/features/portal/hero-showcase"
import { BusinessMarquee } from "@/features/portal/business-marquee"
import { HeroSpotlight } from "@/features/portal/hero-spotlight"
import { PortalHeader } from "@/features/portal/portal-header"
import { ProcessSteps } from "@/features/portal/process-steps"
import { ShowcaseGrid } from "@/features/portal/showcase-grid"

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "en"
  return {
    title: locale === "th" ? `${site.name} | รับทำเว็บไซต์และเว็บแอป` : `${site.name} | Websites and web apps for Thai businesses`,
    description: site.description[locale],
    alternates: { languages: { en: "/en", th: "/th" } },
    openGraph: {
      siteName: site.name,
      description: site.description[locale],
      images: [{ url: `/og/portal-${locale}.png`, width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", images: [`/og/portal-${locale}.png`] },
  }
}

export default async function PortalPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = portalMessages[lang]
  const heroPhrases = t.hero.title.split(" ").length

  return (
    <>
      <SkipLink label={t.skip} />
      <PortalHeader />
      <main id="main" className="flex flex-1 flex-col">
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_50%_0%,black_10%,transparent_70%)] bg-[size:48px_48px] opacity-60"
          />
          <HeroSpotlight />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pt-20 lg:pb-20">
            <div className="flex flex-col gap-7">
            <p className="intro flex items-center gap-2 text-sm text-muted-foreground" style={stagger(0)}>
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2.5 rounded-full bg-signal" />
              </span>
              {t.hero.status}
            </p>
            <h1
              id="hero-title"
              className="max-w-4xl font-heading text-5xl leading-[0.98] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-7xl"
            >
              <Phrased text={t.hero.title} phraseClassName="intro" offset={1} />
            </h1>
            <p className="intro max-w-2xl text-lg leading-relaxed text-muted-foreground" style={stagger(heroPhrases + 1)}>
              {t.hero.body}
            </p>
            <div className="intro flex flex-wrap gap-3" style={stagger(heroPhrases + 2)}>
              <Button asChild size="xl">
                <a href="#showcases">{t.hero.primary}</a>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a href="#contact">{t.hero.secondary}</a>
              </Button>
            </div>
            </div>
            <HeroShowcase locale={lang} />
          </div>
        </section>

        <BusinessMarquee locale={lang} />

        <section id="showcases" aria-labelledby="showcases-title" className="scroll-mt-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-16 pb-20 sm:px-6 lg:pt-20 lg:pb-28">
            <div className="reveal flex max-w-2xl flex-col gap-3">
              <h2 id="showcases-title" className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                {t.showcases.title}
              </h2>
              <p className="text-lg text-muted-foreground">{t.showcases.intro}</p>
            </div>
            <ShowcaseGrid />
          </div>
        </section>

        <section id="services" aria-labelledby="services-title" className="scroll-mt-16 border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:py-28">
            <div className="reveal flex flex-col gap-3">
              <h2 id="services-title" className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                {t.services.title}
              </h2>
              <p className="text-lg text-muted-foreground">{t.services.intro}</p>
            </div>
            <dl className="grid gap-10 sm:grid-cols-2">
              {t.services.items.map((service, index) => (
                <div key={service.name} className="flex flex-col gap-2">
                  <span aria-hidden="true" className="reveal-rule mb-2 h-0.5 bg-foreground" style={stagger(index % 2)} />
                  <dt className="reveal font-heading text-xl font-semibold" style={stagger(index % 2)}>
                    {service.name}
                  </dt>
                  <dd className="reveal leading-relaxed text-muted-foreground" style={stagger((index % 2) + 1)}>
                    {service.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="process-title">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28">
            <h2 id="process-title" className="reveal font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.process.title}
            </h2>
            <ProcessSteps />
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-16 bg-foreground text-background">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 lg:py-28">
            <div className="reveal flex max-w-3xl flex-col gap-4">
              <h2 id="contact-title" className="font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
                <Phrased text={t.contact.title} />
              </h2>
              <p className="text-lg opacity-75">{t.contact.body}</p>
            </div>
            <div className="reveal flex flex-col gap-4 sm:flex-row" style={stagger(1)}>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 rounded-xl bg-background px-5 py-4 text-foreground transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-signal focus-visible:outline-none motion-reduce:transition-none"
              >
                <MailIcon className="size-5" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{t.contact.email}</span>
                  <span className="font-medium">{site.email}</span>
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © <span translate="no">{site.name}</span>, {site.location[lang]}. {t.footer.rights}
          </p>
        </div>
      </footer>
    </>
  )
}
