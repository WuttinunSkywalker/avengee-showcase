import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import type { Product } from "../data/products"
import { shopMessages } from "../i18n/messages"
import { RoastMeter } from "./roast-meter"

/**
 * A stand-up coffee pouch drawn in CSS: crimped top, degassing valve, side
 * gussets and a printed label. Sizes with its container (cqw units), so the
 * same component works as a grid thumbnail and as the hero.
 */
export function CoffeeBag({ product, locale, className }: { product: Product; locale: Locale; className?: string }) {
  const t = shopMessages[locale]
  const size = product.sizes[0]
  const netContents = product.kind === "drip-bags" ? t.coffee.drip(size.amount) : `${size.amount} g`

  return (
    <div className={cn("@container relative aspect-[3/4] w-full", className)} role="img" aria-label={`${product.name}, ${netContents}`}>
      <div
        className="absolute inset-0 rounded-b-[4cqw] shadow-[0_6cqw_10cqw_-6cqw_rgb(43_27_20/0.45)]"
        style={{
          backgroundColor: product.bag,
          backgroundImage:
            "linear-gradient(90deg, rgb(0 0 0 / 0.22) 0%, rgb(0 0 0 / 0) 9%, rgb(255 255 255 / 0.08) 50%, rgb(0 0 0 / 0) 91%, rgb(0 0 0 / 0.22) 100%)",
        }}
      >
        {/* Heat-sealed, crimped top */}
        <div
          className="absolute inset-x-0 top-0 h-[11%] bg-black/25"
          style={{
            clipPath:
              "polygon(0 0,100% 0,100% 80%,97.5% 100%,95% 80%,92.5% 100%,90% 80%,87.5% 100%,85% 80%,82.5% 100%,80% 80%,77.5% 100%,75% 80%,72.5% 100%,70% 80%,67.5% 100%,65% 80%,62.5% 100%,60% 80%,57.5% 100%,55% 80%,52.5% 100%,50% 80%,47.5% 100%,45% 80%,42.5% 100%,40% 80%,37.5% 100%,35% 80%,32.5% 100%,30% 80%,27.5% 100%,25% 80%,22.5% 100%,20% 80%,17.5% 100%,15% 80%,12.5% 100%,10% 80%,7.5% 100%,5% 80%,2.5% 100%,0 80%)",
          }}
        />
        {/* One-way degassing valve */}
        <div className="absolute top-[15%] right-[12%] size-[7cqw] rounded-full border-[0.8cqw] border-black/20 bg-white/15" />

        <div className="absolute inset-x-[11%] top-[24%] bottom-[11%] flex flex-col justify-between rounded-[1.5cqw] bg-[#fffdf9] p-[6cqw] text-[#2b1b14]">
          <div className="flex flex-col gap-[2cqw]">
            <span className="font-heading text-[4.2cqw] font-semibold tracking-wide [font-stretch:125%]">Kaffa Roasters</span>
            <span className="h-[0.6cqw] w-[14cqw] rounded-full" style={{ backgroundColor: product.bag }} />
            <span className="font-heading text-[9.5cqw] leading-[0.98] font-extrabold tracking-[-0.02em] [font-stretch:112%]">
              {product.name}
            </span>
          </div>
          <div className="flex flex-col gap-[2.5cqw] text-[4.2cqw] leading-tight">
            <span className="flex flex-col text-[#66574f]">
              <span>{t.product.process[product.process]}</span>
              <span>{t.product.altitude(...product.origin.altitude)}</span>
            </span>
            <RoastMeter level={product.roast} locale={locale} compact />
            <span className="font-semibold">{netContents}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
