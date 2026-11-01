import React from "react"
import {NavButton} from "src/components/Buttons/NavButton";
import {Home} from "lucide-react";

export default function NotFound() {
  return(
    <div className="h-full w-full bg-background flex flex-col items-center">
      <h2 className="font-black p-5 text-foreground">
        PAGE NOT FOUND
      </h2>
      <NavButton url={'/'}
                 icon={Home}
                 label={"Home"}
                 variant="ghost"
                 className="border-border" />

    </div>
  )
}