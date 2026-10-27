import React from 'react'
import type {QueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import "./nav-bar.css"
import {SidebarTrigger} from "src/components/ui/sidebar";
import {PanelLeftIcon} from "lucide-react";


export default function NavBar () {

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
                <SidebarTrigger className="w-8 h-8 p-0 [&_svg]:size-6!" />
                
            </div>

        </div>
    )
}