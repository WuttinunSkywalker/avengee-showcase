import Image from "next/image"
import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"
import type { Item } from "../data/items"
import { getSeller } from "../data/sellers"
import { marketplaceMessages } from "../i18n/messages"
import { PriceTag } from "./price-tag"

/**
 * A listing photo filling its tile. Long textiles and wide dishes are shown
 * whole instead, over a blurred copy of themselves so their backdrop doesn't
 * read as a box.
 */
export function ListingPhoto({ item, alt, sizes, priority, padding = "p-4", className }: { item: Item; alt: string; sizes: string; priority?: boolean; padding?: string; className?: string }) {
  if (item.fit !== "contain") return <Image src={item.image} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-cover", className)} />
  return (
    <>
      <Image src={item.image} alt="" aria-hidden="true" fill sizes={sizes} className="scale-125 object-cover opacity-60 blur-2xl" />
      <Image src={item.image} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-contain drop-shadow-md", padding, className)} />
    </>
  )
}

/** A listing in the grid: the piece on its plinth, what it is, who sells it, and its tag. */
export function ItemCard({ item, locale, showSeller = true, priority = false }: { item: Item; locale: Locale; showSeller?: boolean; priority?: boolean }) {
  const t = marketplaceMessages[locale]
  const seller = getSeller(item.seller)
  return (
    <article className="group relative flex flex-col gap-3" data-testid="item-card">
      <div className="relative aspect-square overflow-clip rounded-[var(--radius)] bg-plinth">
        <ListingPhoto
          item={item}
          alt=""
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 50vw"
          className={cn("transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]", item.sold && "opacity-70 grayscale-[35%]")}
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-[0.95rem] leading-snug font-medium text-pretty">
          <Link
            href={localePath(locale, `/marketplace/items/${item.id}`)}
            className="rounded-sm after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {item.name[locale]}
          </Link>
        </h3>
        {showSeller && seller && <p className="text-sm text-muted-foreground">{t.card.by(seller.name[locale], seller.town[locale])}</p>}
        <p className="text-sm text-muted-foreground">{item.era[locale]}</p>
      </div>
      <PriceTag price={item.price} sold={item.sold} soldLabel={t.card.sold} className="self-start" />
    </article>
  )
}
