import React from "react";

import Logo from "src/components/Logo/Logo";
import Profile from "src/components/Profile";
import {SidebarTrigger} from "src/components/ui/sidebar";
import {Button} from "src/components/ui/button"
import {useAuth} from "src/components/AuthProvider";
import {NavButton} from "src/components/NavButton";

export default function NavBar() {
  
  const {user} = useAuth();
  
  return (
    <header id="nav-bar-wrapper" className="border-b">
      <div className="flex min-h-14 justify-between items-center px-4 py-2">
        <span className='flex items-center gap-1'>
          <SidebarTrigger />
          <Logo />
        </span>
        {user && <Profile />}
        {!user &&
          <NavButton url={"/login"} label={"Login"} />
        }
      </div>
    </header>
  )
}