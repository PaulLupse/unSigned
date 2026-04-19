import React from 'react'
import {logout} from "../../user/back-end-connection";
import type {QueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import CollapsingDiv from "../CollapsingDiv/CollapsingDiv";

import "./nav-bar.css"


interface NavBarProps {
    isLoading:boolean,
    isSuccess:boolean,
    username:string|null,
    queryClient:QueryClient
    sidebarIsOpen:boolean,
    setSidebarIsOpen:(sidebarIsOpen:boolean)=>void
}

export default function NavBar ({isLoading, isSuccess, username, queryClient, sidebarIsOpen, setSidebarIsOpen}:NavBarProps) {

    const nav = useNavigate()

    return (
        <CollapsingDiv id="Bara de sus" className={'nav-bar'}>
            {

                <div className={'left'}>

                    <div className={'userGroup'}>
                        <button className={'profilePictureButton'} onClick={()=>{nav('/me')} }>
                        </button>
                        <h2 style={{paddingLeft:'10px'}}>
                            :
                        </h2>
                        <h3>
                            {isSuccess?username:'Not logged in'}
                        </h3>
                    </div>
                    {/*{*/}
                    {/*    isSuccess &&*/}
                    {/*    <button*/}
                    {/*        onClick={*/}
                    {/*            async()=> {*/}
                    {/*                if (await logout()) {*/}
                    {/*                    await queryClient.invalidateQueries({queryKey:['username']})*/}
                    {/*                    nav('/me', {replace:true})*/}
                    {/*                }*/}
                    {/*            }*/}
                    {/*        }*/}
                    {/*    >*/}
                    {/*        Log out*/}
                    {/*    </button>*/}
                    {/*}*/}
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

        </CollapsingDiv>
    )
}