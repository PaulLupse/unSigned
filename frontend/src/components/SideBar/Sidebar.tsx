import React from 'react'
import {
  Home,
  Form,
  LayoutTemplate,
  User, type LucideIcon,
} from "lucide-react"
import {
  Sidebar as Sb,
  SidebarContent, SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger
} from "src/components/ui/sidebar";
import {NavButton, SidebarMenuNavButton} from "src/components/NavButton";


type NavItemType = {
  label: string
  url: string
  icon: LucideIcon
}
// Navigation items
const navItems:NavItemType[] = [
  { label: "Home", url: "/", icon: Home },
  { label: "Forms", url: "/me/forms", icon: Form },
  { label: "Templates", url: "/me/templates", icon: LayoutTemplate },
  { label: "Account", url: "/me", icon: User },
]

export function Sidebar() {
  return (
    <Sb className="border-r border-border z-100" side={'right'} >
      {/* Brand / Logo Header */}
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-sm justify-between">
          <span className="tracking-tight">unSigned</span>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuNavButton url={item.url} label={item.label} icon={item.icon} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Simple Footer */}
      {/*<SidebarFooter className="border-t border-border/50 p-2">*/}
      {/*  <SidebarMenu>*/}
      {/*    <SidebarMenuItem>*/}
      {/*      <SidebarMenuButton className="w-full justify-start gap-2">*/}
      {/*        <User className="h-4 w-4 text-muted-foreground" />*/}
      {/*        <div className="flex flex-col text-left text-xs leading-tight">*/}
      {/*          <span className="font-medium">Jane Doe</span>*/}
      {/*          <span className="text-muted-foreground">jane@acme.com</span>*/}
      {/*        </div>*/}
      {/*      </SidebarMenuButton>*/}
      {/*    </SidebarMenuItem>*/}
      {/*  </SidebarMenu>*/}
      {/*</SidebarFooter>*/}
    </Sb>
  )
}