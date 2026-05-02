import React from "react";
import Loading from "src/frontend/components/Loading";
import * as style from './AdminMain.module.css'
import {Outlet} from "react-router-dom";

export default function AdminMain() {


    return (
        <div className={style.main}>
            <Outlet />
        </div>
    )
}