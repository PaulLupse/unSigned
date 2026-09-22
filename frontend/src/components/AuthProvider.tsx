import React, {type Context, createContext, useContext, useEffect, useState} from "react";

import {useQuery} from "@tanstack/react-query";
import {getCurrentUserData} from "src/backend-connection/auth";
import toast from "react-hot-toast";
import type {User} from "src/domain/auth-types";

type AuthDetails = {
    user?:User
    isLoading:boolean
    isSuccess:boolean
    isError:boolean
    isStale:boolean
}

const AuthContext = createContext<AuthDetails>({
        isLoading:false,
        isError:false,
        isSuccess:false,
        isStale:false
    }
)

export function AuthProvider ({children}:{children:React.ReactNode}) {


    const {isSuccess, data, isLoading, isError, isStale} = useQuery(
        {queryKey: ['currentUser'],
        queryFn:getCurrentUserData,
        retry:0,
        structuralSharing: false,
        refetchOnWindowFocus:false},
        )

    return (
        <AuthContext value={{user:data, isLoading, isStale, isSuccess, isError}} >
            {children}
        </AuthContext>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}