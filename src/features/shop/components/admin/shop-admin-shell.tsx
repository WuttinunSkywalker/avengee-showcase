"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BoxesIcon, ExternalLinkIcon, LayoutDashboardIcon, PackageIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ShowcaseReturn } from "@/components/showcase-return"
import { ThemeToggle } from "@/components/theme-toggle"
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
import { Separator } from "@/components/ui/separator"
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
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { shop } from "../../data/shop"
import { shopMessages } from "../../i18n/messages"
import { useShopAdminStore } from "../../store/admin-store"
import { useInventoryStore } from "../../store/inventory-store"

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

function ResetButton() {
  const locale = useLocale()
  const t = shopMessages[locale].admin
  const reset = useShopAdminStore((state) => state.reset)
  const resetInventory = useInventoryStore((state) => state.reset)
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <SidebarMenuButton>
          <RotateCcwIcon aria-hidden="true" />
          <span>{t.nav.reset}</span>
        </SidebarMenuButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.resetTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.resetBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.resetKeep}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              reset()
              resetInventory()
              if (isMobile) setOpenMobile(false)
              toast.success(t.resetDone)
            }}
          >
            {t.resetConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ShopAdminShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const t = shopMessages[locale].admin
  const pathname = usePathname()
  const nav = [
    { href: localePath(locale, "/shop/admin"), label: t.nav.overview, icon: LayoutDashboardIcon },
    { href: localePath(locale, "/shop/admin/orders"), label: t.nav.orders, icon: PackageIcon },
    { href: localePath(locale, "/shop/admin/inventory"), label: t.nav.inventory, icon: BoxesIcon },
  ]
  const current = nav.find((item) => item.href === pathname)

  return (
    <SidebarProvider className="min-h-svh">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href={localePath(locale, "/shop/admin")}>
                  <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-heading font-extrabold text-primary-foreground">
                    K
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-heading text-sm font-extrabold [font-stretch:115%]" translate="no">
                      {shop.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{t.brand}</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t.navLabel}</SidebarGroupLabel>
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
              <SidebarMenuButton asChild tooltip={t.nav.store}>
                <Link href={localePath(locale, "/shop")}>
                  <ExternalLinkIcon aria-hidden="true" />
                  <span>{t.nav.store}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ResetButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <p className="font-medium">{current?.label ?? t.nav.overview}</p>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle label={t.darkMode} />
            <ShowcaseReturn inline />
          </div>
        </header>
        {/* SidebarInset already renders <main>; this is the skip-link target. */}
        <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
