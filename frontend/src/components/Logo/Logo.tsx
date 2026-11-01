import React from "react";
import {useNavigate} from "react-router-dom";
import * as style from "./logo.module.css"
import {cn} from "cn";

interface LogoProps {
  className?:string
}

export default function Logo({className}:LogoProps) {

  const nav = useNavigate()

  return (
    <span className={cn(className ? className : "", "bg-background")}>
      <h1 onClick={()=>{nav("/")}} className={style.logo}>
        unSigned
      </h1>
    </span>

  )
}