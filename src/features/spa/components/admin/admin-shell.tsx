"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDaysIcon, ExternalLinkIcon, LayoutDashboardIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ShowcaseReturn } from "@/components/showcase-return"
import { ThemeToggle } from "@/components/theme-toggle"
import { spa } from "../../data/spa"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { useBookingsStore } from "../../store/bookings-store"

/** Link that also closes the off-canvas sidebar on phones, so the new page is visible. */
/** Closes the phone sidebar after navigating. Forwards the props SidebarMenuButton's Slot passes in. */
function NavLink({ onClick, ...props }: React.ComponentProps<typeof Link>) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (isMobile) setOpenMobile(false)
      }}
    />
  )
}

function ResetDataButton() {
  const { t } = useSpaI18n()
  const reset = useBookingsStore((state) => state.reset)
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <SidebarMenuButton>
          <RotateCcwIcon aria-hidden="true" />
          <span>{t.admin.reset}</span>
        </SidebarMenuButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.admin.resetTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.admin.resetBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.admin.resetKeep}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              reset()
              if (isMobile) setOpenMobile(false)
              toast.success(t.admin.resetDone)
            }}
          >
            {t.admin.resetConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { locale, t, href } = useSpaI18n()
  const pathname = usePathname()
  const nav = [
    { href: href("/spa/admin"), label: t.admin.overview, icon: LayoutDashboardIcon },
    { href: href("/spa/admin/bookings"), label: t.admin.bookings, icon: CalendarDaysIcon },
  ]
  const current = nav.find((item) => item.href === pathname)

  return (
    <div className="flex min-h-svh flex-col">
      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href={href("/spa/admin")}>
                    <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-heading text-primary-foreground">
                      {spa.name[locale].slice(0, 1)}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="font-heading text-base" translate="no">
                        {spa.name[locale]}
                      </span>
                      <span className="text-xs text-muted-foreground">{t.brand.frontDesk}</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t.admin.manage}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                        <NavLink href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.guestSite}>
                  <Link href={href("/spa")}>
                    <ExternalLinkIcon aria-hidden="true" />
                    <span>{t.admin.guestSite}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ResetDataButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <p className="font-medium">{current?.label ?? t.admin.overview}</p>
            <div className="ml-auto flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle label={t.admin.darkMode} />
              <ShowcaseReturn inline />
            </div>
          </header>
          {/* SidebarInset already renders <main>; this is the skip-link target. */}
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
