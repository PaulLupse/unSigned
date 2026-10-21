import React from 'react'
import {
  Calendar,
  Home,
  Inbox,
  LogOut,
  Search,
  Settings,
  User,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from "src/components/ui/sidebar";


// Navigation items
const navItems = [
  { title: "Home", url: "#", icon: Home },
  { title: "Inbox", url: "#", icon: Inbox },
  { title: "Calendar", url: "#", icon: Calendar },
  { title: "Search", url: "#", icon: Search },
  { title: "Settings", url: "#", icon: Settings },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border bg-red " side={'right'}>
      {/* Brand / Logo Header */}
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background text-xs font-bold">
            A
          </div>
          <span className="tracking-tight">Acme Inc</span>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Simple Footer */}
      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col text-left text-xs leading-tight">
                <span className="font-medium">Jane Doe</span>
                <span className="text-muted-foreground">jane@acme.com</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}