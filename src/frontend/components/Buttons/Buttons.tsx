import React, {useEffect, useRef} from "react";
import {type To, useNavigate} from "react-router-dom";

interface NavButtonProps extends React.ComponentPropsWithoutRef<'button'> {
    children:React.ReactNode
    to:string
}

export function NavButton({to, children, ...rest}:NavButtonProps) {
    const navigate = useNavigate()
    const buttonRef = useRef<HTMLButtonElement>(null);

    const navEvent = ()=>{navigate(to);}

    useEffect(()=>{
        buttonRef.current?.addEventListener("click", navEvent);
        return ()=>{
            buttonRef.current?.removeEventListener("click", navEvent);
        }
    }, [buttonRef])

    return(
        <button ref={buttonRef} {...rest}>
            {children}
        </button>
    )
}

interface BackButtonProps extends React.ComponentPropsWithoutRef<'button'> {
    children:React.ReactNode
}

export function BackButton({children, ...rest}:BackButtonProps) {
    const navigate = useNavigate()
    return(
        <button onClick={() => { navigate(-1) }} {...rest}>
            {children}
        </button>
    )
}