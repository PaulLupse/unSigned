import React from 'react'
import {logout} from "../../server/users-server";
import type {QueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import CollapsingDiv from "../CollapsingDiv/CollapsingDiv";

import "./nav-bar.css"


interface NavBarProps {
    isLoading:boolean,
    isSuccess:boolean,
    queryClient:QueryClient
    sidebarIsOpen:boolean,
    setSidebarIsOpen:(sidebarIsOpen:boolean)=>void
}

export default function NavBar ({sidebarIsOpen, setSidebarIsOpen}:NavBarProps) {

    const nav = useNavigate()

    return (
        <div id="Bara de sus" className={'nav-bar'}>
            {

                <div className={'left'}>
                    <div className={'userGroup'}>
                        <button className={'profilePictureButton'} onClick={()=>{nav('/me')} } />
                    </div>
                </div>
            }
            <div>
                <h1>
                    unSigned
                </h1>
            </div>

            <div className={'right'}>
                <button onClick={()=>{setSidebarIsOpen(!sidebarIsOpen)}} />
            </div>

        </div>
    )
}