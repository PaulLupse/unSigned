import * as React from "react"
import {Menu, ChevronDown, Compass, ExternalLink, type LucideIcon} from "lucide-react"
import { cn } from "cn"
import { Button } from "src/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "src/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "src/components/ui/navigation-menu"
import Logo from "src/components/Logo/Logo";
import {NavButton} from "src/components/Buttons/NavButton";
import {Link, NavLink} from "react-router-dom";


export type NavItemVariant = "link" | "button" | "primary-button" | "secondary-button"

export interface NavSubItem {
  id: string
  label: string
  href: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface NavItem {
  id: string
  label: string
  href?: string
  onClick?: () => void
  variant?: NavItemVariant
  icon?: LucideIcon
  children?: NavSubItem[]
  /**
   * Optional priority score:
   * Higher priority items stay visible in navbar longer.
   * If omitted, items overflow in natural reading order (last items wrap first, like flex-wrap).
   */
  priority?: number
}

export interface ResponsiveOverflowNavbarProps {
  /** Logo / Brand element rendered on the far left */
  brand?: React.ReactNode
  /** Navigation items list */
  items?: NavItem[]
  /** Custom class for the navbar <header> */
  className?: string
  /** Custom class for the inner container */
  containerClassName?: string
  /** Title displayed at the top of the mobile / sidebar Sheet */
  sidebarTitle?: string
  /** Subtitle / Description displayed in the sidebar Sheet */
  sidebarDescription?: string
  /** Side from which the Sheet slides in */
  sheetSide?: "top" | "bottom" | "left" | "right"
  /** Label for the overflow trigger button (accessible / visible) */
  triggerLabel?: string
  /** Additional persistent elements on the far right (e.g. Theme toggle) */
  extraActions?: React.ReactNode
  /** Callback fired whenever visible / overflow item counts change */
  onOverflowChange?: (status: { visibleCount: number; overflowCount: number }) => void
}



/**
 * Placeholder
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: "HowTo",
    label: "How to use",
    href: "/404",
    variant: "link"
  },
  {
    id: "Templates",
    label: "Templates",
    href: "/templates",
    variant: "link"
  },
  {
    id: "signup",
    label: "Register",
    href: "/register",
    variant: "primary-button",
  },
  {
    id: "login",
    label: "Log in",
    href: "/login",
    variant: "button",
  },
]

/**
 * Renders an item in the top horizontal Navigation Menu
 */
function NavbarItemRenderer({
  item,
  isMeasurement = false,
}: {
  item: NavItem
  isMeasurement?: boolean
}) {
  // If item has dropdown children, render Base UI NavigationMenu trigger & content
  if (item.children && item.children.length > 0) {
    return (
      <NavigationMenuItem
        value={item.id}
        data-measure-item={isMeasurement ? "" : undefined}
        className="relative shrink-0"
      >
        <NavigationMenuTrigger className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
          {item.label}
        </NavigationMenuTrigger>
        {!isMeasurement && (
          <NavigationMenuContent className="w-[320px] p-2 sm:w-[380px]">
            <ul className="flex flex-col gap-1">
              {item.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={child.href}
                    className="block rounded-md p-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground select-none"
                  >
                    <div className="font-medium text-foreground">{child.label}</div>
                    {child.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                        {child.description}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        )}
      </NavigationMenuItem>
    )
  }

  // Button variants
  if (item.variant === "primary-button" || item.variant === "button") {
    return (
      <NavigationMenuItem
        value={item.id}
        data-measure-item={isMeasurement ? "" : undefined}
        className="shrink-0"
      >
        <NavButton variant={item.variant === "primary-button"?"default":"outline"}
                   url={item.href?item.href:"/"}
                   label={item.label}
                   icon={item.icon} />

      </NavigationMenuItem>
    )
  }

  // Standard navigation link
  return (
    <NavigationMenuItem
      value={item.id}
      data-measure-item={isMeasurement ? "" : undefined}
      className="shrink-0"
    >
      <NavigationMenuLink className="text-muted-foreground hover:text-foreground hover:bg-accent" render={
        <NavLink to={item.href?item.href:"/404"}>{item.label}</NavLink>}>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

/**
 * Renders an item inside the Sidebar Sheet
 */
function SidebarItemRenderer({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Submenu
  if (item.children && item.children.length > 0) {
    return (
      <div className="flex flex-col border-b border-border/50 py-1 last:border-b-0">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
            {item.label}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        {isOpen && (
          <div className="ml-4 flex flex-col gap-1 border-l border-border pl-3 pt-1 pb-2">
            {item.children.map((child) => (
              <a
                key={child.id}
                href={child.href}
                onClick={onNavigate}
                className="group flex flex-col rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
              >
                <div className="font-medium text-foreground group-hover:text-accent-foreground">
                  {child.label}
                </div>
                {child.description && (
                  <div className="text-[11px] text-muted-foreground">
                    {child.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Primary action button
  if (item.variant === "primary-button") {
    return (
      <div className="py-1">
        <Button
          variant="default"
          className="w-full justify-center h-9 text-sm"
          render={<a href={item.href} onClick={onNavigate} />}
        >
          {item.icon && <item.icon className="mr-2 h-4 w-4" />}
          {item.label}
        </Button>
      </div>
    )
  }

  // Outline action button
  if (item.variant === "button") {
    return (
      <div className="p-1">
        <Button
          variant="outline"
          className="w-full justify-center h-9 text-sm"
          render={<a href={item.href} onClick={onNavigate} />}
        >
          {item.icon && <item.icon className="mr-2 h-4 w-4" />}
          {item.label}
        </Button>
      </div>
    )
  }

  // Standard link
  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      <span className="flex items-center gap-2">
        {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
        {item.label}
      </span>
    </a>
  )
}

/**
 * Main Responsive Overflow Navbar Component
 */
export default function NavBar({
  brand = (
    <Logo />
  ),
  items = NAV_ITEMS,
  className,
  containerClassName,
  sidebarTitle = "Navigation",
  sidebarDescription,
  sheetSide = "right",
  triggerLabel = "Menu",
  extraActions,
  onOverflowChange,
}: ResponsiveOverflowNavbarProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Number of items visible in the navbar
  const [visibleCount, setVisibleCount] = React.useState<number>(0)

  // Container ref where visible navigation items live
  const navContainerRef = React.useRef<HTMLDivElement>(null)

  // Offscreen measurement strip ref
  const measureStripRef = React.useRef<HTMLDivElement>(null)

  // Cached item widths and trigger width
  const itemWidthsRef = React.useRef<number[]>([])
  const triggerWidthRef = React.useRef<number>(0)

  // Calculate layout and overflow
  const calculateLayout = React.useCallback(() => {
    const container = navContainerRef.current
    const measureStrip = measureStripRef.current
    if (!container || !measureStrip) return

    // 1. Measure item widths from the offscreen measurement strip
    const itemElements:NodeListOf<HTMLElement> = measureStrip.querySelectorAll<HTMLElement>("[data-measure-item]")
    const newWidths: number[] = new Array<number>()
    itemElements.forEach((el) => {
      newWidths.push(el.getBoundingClientRect().width)
    })
    itemWidthsRef.current = newWidths

    // 2. Measure sheet trigger button width
    const triggerEl = measureStrip.querySelector<HTMLElement>("[data-measure-trigger]")
    if (triggerEl) {
      triggerWidthRef.current = triggerEl.getBoundingClientRect().width
    }

    const containerWidth = container.clientWidth
    if (containerWidth <= 0) return

    const GAP = 4 // Matches gap-1 (0.25rem = 4px)
    const n = newWidths.length

    // Step A: Check if ALL items fit without the Sheet trigger
    let totalAllWidth = 0
    for (let i = 0; i < n; i++) { // @ts-ignore
      totalAllWidth += newWidths[i] + (i>0?GAP:0)
    }

    if (totalAllWidth <= containerWidth) {
      // Everything fits! No items moved to sidebar
      setVisibleCount(n)
      onOverflowChange?.({ visibleCount: n, overflowCount: 0 })
      return
    }

    // Step B: Container cannot fit all items.
    // Sheet trigger MUST be visible to hold the overflowed items.
    const triggerWidth = triggerWidthRef.current || 75
    const spaceForItems = containerWidth

    if (spaceForItems <= 0) {
      // Container is extremely narrow: all items move to sidebar
      setVisibleCount(0)
      onOverflowChange?.({ visibleCount: 0, overflowCount: n })
      return
    }

    // Greedily fit items from left to right (like a flex row that wraps its tail)
    let usedWidth = 0
    let fitCount = 0

    console.log("####################")

    for (let i = n-1; i >= 0; i--) {

      const widthNeeded:number = fitCount === n-1 ? newWidths[i] : newWidths[i] + GAP
      if (usedWidth + widthNeeded <= spaceForItems) {
        usedWidth += widthNeeded
        fitCount++
      } else {
        // This item and all following items move to sidebar
        break
      }
    }

    console.log("c" + containerWidth)
    console.log("s" + spaceForItems)
    console.log("u" + usedWidth)


    setVisibleCount(fitCount)
    onOverflowChange?.({ visibleCount: fitCount, overflowCount: n - fitCount })
  }, [items, onOverflowChange])

  // Observe container resizing with ResizeObserver
  React.useEffect(() => {
    const container = navContainerRef.current
    if (!container) return

    let animationFrameId: number | null = null

    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      animationFrameId = requestAnimationFrame(() => {
        calculateLayout()
      })
    })

    resizeObserver.observe(container)
    // Run initial calculation
    calculateLayout()

    return () => {
      resizeObserver.disconnect()
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [calculateLayout])

  // Recalculate whenever items change
  React.useEffect(() => {
    calculateLayout()
  }, [items, calculateLayout])

  const n = items.length;

  // Partition items into visible (navbar) and overflow (sidebar)
  const visibleItems = items.slice(n - visibleCount, n)
  const overflowItems = items.slice(0, n - visibleCount).reverse()

  console.log(visibleCount)
  console.log(n)

  return (
    <header
      data-slot="navbar"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6",
          containerClassName
        )}
      >

        {/* Brand / Logo */}
        <div data-slot="navbar-brand" className="shrink-0 flex items-center">
          {brand}
        </div>

        {/* Dynamic Overflow Container */}
        <div
          ref={navContainerRef}
          data-slot="navbar-dynamic-area"
          className="flex flex-1 min-w-0 items-center justify-end gap-1 overflow-hidden"
        >
          {/* Visible Navbar Items */}
          {visibleItems.length > 0 && (
            <NavigationMenu className="max-w-full">
              <NavigationMenuList className="flex-nowrap gap-1 justify-end">
                {visibleItems.map((item) => (
                  <NavbarItemRenderer key={item.id} item={item} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          )}


        </div>
        {/* Overflow Trigger -> Base UI Sheet */}
          {overflowItems.length > 0 && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative flex items-center gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground shrink-0 select-none cursor-pointer"
                    aria-label={`${overflowItems.length} more navigation items`}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                }
              />
              <SheetContent side={sheetSide} className="w-[300px] sm:w-[350px] flex flex-col">
                <SheetHeader className="border-b border-border pb-4 text-left">
                  <SheetTitle>{sidebarTitle}</SheetTitle>
                  {sidebarDescription && (
                    <SheetDescription>{sidebarDescription}</SheetDescription>
                  )}
                </SheetHeader>

                {/* Vertical list of items that overflowed into sidebar */}
                <div
                  data-slot="sidebar-items"
                  className="flex-1 overflow-y-auto flex flex-col gap-1"
                >
                  {overflowItems.map((item) => (
                    <SidebarItemRenderer
                      key={item.id}
                      item={item}
                      onNavigate={() => setSheetOpen(false)}
                    />
                  ))}
                </div>

                <SheetFooter className="border-t border-border pt-3">
                  <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <span>unSigned</span>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
      </div>

      {/* Hidden Offscreen Measurement Strip (Never visible, used for exact pixel calculations) */}
      <div
        ref={measureStripRef}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none invisible fixed -top-[9999px] -left-[9999px] flex items-center gap-1 opacity-0 -z-50 select-none"
      >
        <NavigationMenu className="max-w-none flex-none">
          <NavigationMenuList className="flex-nowrap gap-1">
            {items.map((item) => (
              <NavbarItemRenderer key={item.id} item={item} isMeasurement />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div data-measure-trigger className="shrink-0 whitespace-nowrap">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium"
          >
            <Menu className="h-4 w-4" />
            {/*<span>{triggerLabel}</span>*/}
            {/*<span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground border border-border">*/}
            {/*  99*/}
            {/*</span>*/}
          </Button>
        </div>
      </div>
    </header>
  )
}
