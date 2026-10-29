"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className, label = "Toggle dark mode" }: { className?: string; label?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const next = resolvedTheme === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(next)}
      aria-label={label}
    >
      <SunIcon className="hidden size-4 dark:block" aria-hidden="true" />
      <MoonIcon className="size-4 dark:hidden" aria-hidden="true" />
    </Button>
  )
}
