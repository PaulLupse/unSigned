import React from "react";
import {useContext, createContext, useState} from "react";
import LoadingOverlay from "src/components/LoadingOverlay/LoadingOverlay";

const LoadingOverlayContext = createContext({showLoading:()=>{}, hideLoading:()=>{}})

export function LoadingOverlayProvider ({children}:{children:React.ReactNode}) {

    const [loading, setIsLoading] = useState<boolean>(false)

    const showLoading = () => {
        setIsLoading(true)
    }

    const hideLoading = () => {
        setIsLoading(false)
    }

    return (
        <LoadingOverlayContext value={{showLoading, hideLoading}}>
            {children}
            <LoadingOverlay isLoading={loading} />
        </LoadingOverlayContext>
    )
}

export const useLoading = ():{showLoading:()=>void, hideLoading:()=>void} => {
    const context = useContext(LoadingOverlayContext)
    if (!context) throw Error("The 'useLoading' hook must be used inside the LoadingOverlay context provider component.")
    return context
}