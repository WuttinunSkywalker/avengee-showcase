export function SkipLink({ href = "#main", label = "Skip to content" }: { href?: string; label?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground"
    >
      {label}
    </a>
  )
}
