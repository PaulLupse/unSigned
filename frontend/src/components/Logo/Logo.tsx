import React from "react";
import {useNavigate} from "react-router-dom";
import * as style from "./logo.module.css"

export default function Logo() {

  const nav = useNavigate()

  return (
    <span className="p-1">
      <h1 onClick={()=>{nav("/")}} className={style.logo}>
        unSigned
      </h1>
    </span>

  )
}