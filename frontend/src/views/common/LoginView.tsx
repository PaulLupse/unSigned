import Logo from "src/components/Logo/Logo";
import {LoginForm} from "src/components/CredentialForm/CredentialForm";
import {Link} from "react-router-dom";
import React from "react";
import {NavButton} from "src/components/Buttons/NavButton";
import {Home} from "lucide-react";


export default function LoginView() {

  return (
    <div className="w-full h-full grid grid-cols-[45%_55%] max-sm:grid-cols-1">
      <div className="border-border text-background bg-secondary-foreground p-10 grid place-items-center grid-rows-[auto_1fr_auto]
                      max-sm:hidden">
        <div className="place-self-start">
          <span className="pb-2 text-xs">Welcome</span>
        </div>


        <div className="flex flex-col gap-2">
          <span className="text-4xl">Anonymity.</span>
          <span className="text-4xl">Privacy.</span>
          <span className="text-4xl">Innovation.</span>
          <span className=" text-xs">One account for all your forms.</span>
        </div>

        <div className="place-self-start">
          <NavButton url={'/'}
                     className="bg-secondary-foreground
                                 text-background
                                 text-xs"
                     label={"Back to home page"}
                     icon={Home} />
        </div>

      </div>
      <div className="grid place-items-center border bg-background">
        <LoginForm />
          <div className="flex items-center justify-center gap-2">
            <span>
              Don't have an account?
            </span>
            <Link to={'/register'} style={{color:'green'}}>
              Register
            </Link>
          </div>
      </div>
    </div>
  )
}