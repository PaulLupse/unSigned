import React from "react";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuItem,
  navigationMenuTriggerStyle
} from "src/components/ui/navigation-menu"
import Logo from "src/components/Logo/Logo";
import {Avatar, AvatarImage} from "src/components/ui/avatar";
import Profile from "src/components/Profile";
import {SidebarTrigger} from "src/components/ui/sidebar";

export default function NavBar() {

  return (
    <header id="nav-bar-wrapper" className="border-b">
      <div className="flex min-h-14 justify-between items-center px-4 py-2">
        <span className='flex items-center gap-1'>
          <Logo />
          <Profile />
        </span>
        <SidebarTrigger className='[&_svg]:size-8!' />
      </div>
    </header>
  )
}