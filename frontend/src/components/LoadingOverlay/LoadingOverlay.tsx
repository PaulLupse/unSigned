import React, {useEffect, useRef} from "react";
import {CircularProgress} from "@mui/material";

import * as style from './LoadingOverlay.module.css'

interface LoadingOverlayProps {
    isLoading:boolean
}
export default function LoadingOverlay ({isLoading}:LoadingOverlayProps) {

    const ref = useRef<HTMLDialogElement>(null);

    useEffect(()=>{
        if(isLoading) ref.current?.showModal()
        else ref.current?.close()
    }, [isLoading])

    return (
        <dialog ref={ref} className={style.dialog}>
            <CircularProgress color='black' />
        </dialog>
    )
}