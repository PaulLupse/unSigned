import {AvatarImage, Avatar} from "src/components/ui/avatar";
import {useAuth} from "src/components/AuthProvider";
import React from "react";
import {useNavigate} from "react-router-dom";

export default function Profile() {

  const {user} = useAuth()
  const nav = useNavigate()

  return (
    <span className="flex gap-2 items-center border-2 rounded-xl p-1 bg-gray-50 hover:bg-primary/10">

      <Avatar size="lg" className="hover:bg-primary/30 active:bg-primary/50" onClick={()=>{nav('/me')}}>
        <AvatarImage src="images/account.png" />
      </Avatar>

      {user &&
        <span className="flex flex-col">
          <span className="font-medium">
            {user?.username}
          </span>
          <span className="text-muted-foreground text-xs">
            {user?.email}
          </span>
        </span>
      }
    </span>
  )
}