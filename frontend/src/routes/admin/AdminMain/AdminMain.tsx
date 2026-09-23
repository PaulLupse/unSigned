import React from "react";
import * as style from './AdminMain.module.css'
import {Outlet} from "react-router-dom";

export default function AdminMain() {


    return (
        <div className={style.main}>
            <Outlet />
        </div>
    )
}