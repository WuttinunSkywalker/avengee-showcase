"use client"

import { useState } from "react"
import { TagIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { useLocale } from "@/i18n/locale-provider"
import { shopMessages } from "../../i18n/messages"
import { applyShopPromo } from "../../lib/checkout"
import { useCartStore } from "../../store/cart-store"

/** Promo code entry shared by the cart drawer and checkout. Codes are re-checked against the cart on every render. */
export function PromoField({ subtotal, id }: { subtotal: number; id: string }) {
  const locale = useLocale()
  const t = shopMessages[locale].promo
  const promoCode = useCartStore((state) => state.promoCode)
  const setPromoCode = useCartStore((state) => state.setPromoCode)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const applied = promoCode ? applyShopPromo(promoCode, subtotal) : null

  function apply() {
    if (!value.trim()) return setError(t.enterFirst)
    const result = applyShopPromo(value, subtotal)
    if (!result.ok) return setError(t.errors[result.reason](result.code))
    setPromoCode(result.code)
    setValue("")
    setError(null)
  }

  if (applied?.ok) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-secondary px-3 py-2 text-sm" role="status">
        <span className="flex items-center gap-2">
          <TagIcon className="size-4 text-leaf" aria-hidden="true" />
          {t.applied(applied.code)}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label={t.remove(applied.code)} onClick={() => setPromoCode(null)}>
          <XIcon aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <Field data-invalid={!!error || (applied && !applied.ok) || undefined}>
      <FieldLabel htmlFor={id} className="sr-only">
        {t.label}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              apply()
            }
          }}
          placeholder={t.placeholder}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          aria-label={t.label}
          aria-invalid={!!error}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={apply}>{t.apply}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : applied && !applied.ok ? (
        <FieldError>{t.errors[applied.reason](applied.code)}</FieldError>
      ) : (
        <FieldDescription>{t.hint}</FieldDescription>
      )}
    </Field>
  )
}
