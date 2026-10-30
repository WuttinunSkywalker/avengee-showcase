import { Skeleton } from "@/components/ui/skeleton"

/** Holds the grid's place while the search reads the URL. */
export function BrowseFallback() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-14 w-full" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  )
}
