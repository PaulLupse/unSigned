import React from 'react'
import {logout} from "../../user/back-end-connection";
import type {QueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import "./nav-bar.css"

interface NavBarProps {
    isLoading:boolean,
    isSuccess:boolean,
    username:string|null,
    queryClient:QueryClient
}

export default function NavBar ({isLoading, isSuccess, username, queryClient}:NavBarProps) {

    const nav = useNavigate()

    return (
        <div id="Bara de sus" className={'nav-bar'}>
            {
                isLoading?
                <div className={'loading'}>
                    <h2>
                        Loading...
                    </h2>
                </div>:

                <div className={'left'}>

                    <p>
                        Current user: {isSuccess?username:'none'}
                    </p>
                    {
                        isSuccess &&
                        <button
                            onClick={
                                async()=> {
                                    if (await logout()) {
                                        await queryClient.invalidateQueries({queryKey:['username']})
                                        nav('/', {replace:true})
                                    }
                                }
                            }
                        >
                            Log out
                        </button>
                    }
                </div>
            }
            <div>
                <h1>
                    Main Page
                </h1>
            </div>

        </div>
    )
}