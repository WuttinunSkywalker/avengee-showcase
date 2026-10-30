"use client"

import Image from "next/image"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ImagePlusIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { localePath, type Locale } from "@/i18n/config"
import { CATEGORIES, items, type Category } from "../data/items"
import { marketplaceMessages } from "../i18n/messages"
import { createListing, parsePrice, photoProblem, validPrice } from "../lib/listings"
import { resizePhoto } from "../lib/photo"
import { useListingsStore } from "../store/basket-store"
import { itemPath } from "./item-card"

type Values = { name: string; category: Category; description: string; era: string; size: string; condition: string; price: string }

/** A dealer lists a new piece: one photo, what it is, and a price. It's on the market as soon as it's saved. */
export function NewListing({ sellerId, locale }: { sellerId: string; locale: Locale }) {
  const t = marketplaceMessages[locale].centre.listings
  const f = t.new
  const router = useRouter()
  const addItem = useListingsStore((state) => state.addItem)
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  // Start on the kind of piece this dealer lists most
  const usual = useMemo(() => {
    const own = items.filter((item) => item.seller === sellerId)
    return CATEGORIES.reduce((best, category) => (own.filter((item) => item.category === category).length > own.filter((item) => item.category === best).length ? category : best))
  }, [sellerId])
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(3, f.errors.name),
        category: z.enum(CATEGORIES),
        description: z.string().trim().min(10, f.errors.details),
        era: z.string().trim().min(3, f.errors.era),
        size: z.string().trim().min(2, f.errors.size),
        condition: z.string().trim().min(3, f.errors.condition),
        price: z.string().refine((value) => validPrice(parsePrice(value)), t.priceError),
      }),
    [f, t],
  )
  const defaults: Values = { name: "", category: usual, description: "", era: "", size: "", condition: "", price: "" }
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults, mode: "onTouched" })

  const reset = () => {
    form.reset(defaults)
    setPhoto(null)
    setPhotoError(null)
  }

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return
    const problem = photoProblem(file)
    if (problem) {
      setPhotoError(problem === "type" ? f.errors.photoType : f.errors.photoSize)
      return
    }
    try {
      setPhoto(await resizePhoto(file))
      setPhotoError(null)
    } catch {
      setPhotoError(f.errors.photoRead)
    }
  }

  // A missing photo is reported alongside the other fields, not after them
  const needPhoto = () => {
    if (!photo && !photoError) setPhotoError(f.errors.photo)
  }
  const onSubmit = form.handleSubmit((values) => {
    if (!photo) {
      needPhoto()
      return
    }
    const item = createListing({ ...values, price: parsePrice(values.price), image: photo }, sellerId, new Date())
    addItem(item)
    toast.success(f.listed(item.name[locale]), { action: { label: f.view, onClick: () => router.push(localePath(locale, itemPath(item))) } })
    setOpen(false)
    reset()
  }, needPhoto)

  const text = (name: Exclude<keyof Values, "category" | "price">, label: string, placeholder?: string, long = false) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`listing-${name}`}>{label}</FieldLabel>
          {long ? (
            <Textarea {...field} id={`listing-${name}`} rows={3} aria-invalid={fieldState.invalid} placeholder={placeholder} />
          ) : (
            <Input {...field} id={`listing-${name}`} aria-invalid={fieldState.invalid} placeholder={placeholder} autoComplete="off" />
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          {f.open}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg" data-testid="new-listing">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-heading text-2xl font-normal">{f.title}</SheetTitle>
          <SheetDescription>{f.description}</SheetDescription>
        </SheetHeader>
        <form id="new-listing-form" onSubmit={onSubmit} noValidate className="flex-1 overflow-y-auto overscroll-contain p-4">
          <FieldGroup>
            <Field data-invalid={Boolean(photoError)}>
              <FieldLabel htmlFor="listing-photo">{f.photo}</FieldLabel>
              <div className="flex items-center gap-4">
                <div className="relative flex size-24 shrink-0 items-center justify-center overflow-clip rounded-[var(--radius)] border border-dashed border-border bg-plinth">
                  {photo ? (
                    <Image src={photo} alt={f.photoAlt} fill unoptimized className="object-cover" />
                  ) : (
                    <ImagePlusIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => fileInput.current?.click()}>
                    {photo ? f.photoChange : f.photoChoose}
                  </Button>
                  <FieldDescription>{f.photoHint}</FieldDescription>
                </div>
                <input
                  ref={fileInput}
                  id="listing-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  aria-invalid={Boolean(photoError)}
                  onChange={(event) => {
                    void choosePhoto(event.target.files?.[0])
                    event.target.value = ""
                  }}
                />
              </div>
              {photoError && <FieldError>{photoError}</FieldError>}
            </Field>
            {text("name", f.name, f.namePlaceholder)}
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel id="listing-category">{f.category}</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(value) => value && field.onChange(value)}
                    aria-labelledby="listing-category"
                    className="flex-wrap justify-start"
                  >
                    {CATEGORIES.map((category) => (
                      <ToggleGroupItem key={category} value={category} className="px-3">
                        {marketplaceMessages[locale].categories[category]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              )}
            />
            {text("description", f.details, undefined, true)}
            {text("era", f.era, f.eraPlaceholder)}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("size", f.size, f.sizePlaceholder)}
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="listing-price-new">{f.price}</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>฿</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="listing-price-new" inputMode="numeric" autoComplete="off" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            {text("condition", f.condition, f.conditionPlaceholder)}
          </FieldGroup>
        </form>
        <SheetFooter className="border-t border-border sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {f.cancel}
          </Button>
          <Button type="submit" form="new-listing-form">
            {f.submit}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
