"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/i18n/locale-provider"
import { getProvince, provinces } from "@/lib/thailand"
import { cn } from "@/lib/utils"

/** A searchable list of all 77 provinces, matching Thai or English names. */
export function ProvincePicker({
  id,
  value,
  onChange,
  invalid,
  labels,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid: boolean
  labels: { placeholder: string; search: string; empty: string }
}) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const selected = getProvince(value)
  const sorted = useMemo(
    () => [...provinces].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale === "th" ? "th" : "en")),
    [locale],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn("h-10 w-full justify-between font-normal", !selected && "text-muted-foreground")}
        >
          {selected ? selected.name[locale] : labels.placeholder}
          <ChevronsUpDownIcon className="opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        // No exit animation: while a closing popover lingers, Radix treats the next radio click's
        // synthetic event as an outside click and calls flushSync inside an effect.
        className="w-[--radix-popover-trigger-width] p-0 data-[state=closed]:animate-none"
        align="start"
      >
        <Command
          filter={(itemValue, search) => {
            const province = getProvince(itemValue)
            const haystack = province ? `${province.name.en} ${province.name.th}`.toLowerCase() : itemValue
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {sorted.map((province) => (
                <CommandItem
                  key={province.id}
                  value={province.id}
                  onSelect={(next) => {
                    onChange(next)
                    setOpen(false)
                  }}
                >
                  {province.name[locale]}
                  <CheckIcon className={cn("ml-auto", value === province.id ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
