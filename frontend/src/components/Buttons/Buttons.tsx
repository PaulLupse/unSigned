import React, {useEffect, useRef} from "react";
import {type To, useNavigate} from "react-router-dom";

interface NavButtonProps extends React.ComponentPropsWithoutRef<'button'> {
    children:React.ReactNode
    to:string|number
}

export function NavButton({to, children, ...rest}:NavButtonProps) {
    const navigate = useNavigate()
    const buttonRef = useRef<HTMLButtonElement>(null);


    const navEvent = ()=>{ // @ts-ignore
        navigate(to );}

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

interface ToggleButtonWithIconProps extends React.ComponentPropsWithoutRef<'button'> {
    isOn:boolean
    toggleIsOn:()=>void
    offImg:string
    onImg:string
    // Functia onClick este optionala
    onClick?:()=>void
    style?:React.CSSProperties
}

// Un buton de tip toggle, ce afiseaza doua imagini, in functie de stare.
// Starea de activare este considerata externa, prin intermediul proprietatii "isOn". Trebuie oferita functia de setare
// a starii.
export function ToggleButtonWithIcon({isOn, toggleIsOn, onClick, offImg, onImg, style, ...rest}:ToggleButtonWithIconProps) {

    let defaultStyle:React.CSSProperties =
        {height:"2rem",
        aspectRatio:"1/1",
        padding:"0",
        alignItems:"center",
        justifyItems:"center"}

    Object.assign(defaultStyle, style)

    return (
        <button style={defaultStyle} onClick={()=>{
            toggleIsOn()
            if (onClick) onClick()
        }} {...rest}>

            <img style={{
                width:"75%",
                aspectRatio:"1/1",
                display:"block",
            }}
                 src={isOn?onImg:offImg} alt=''></img>
        </button>
    )
}


interface ButtonWithIconProps extends React.ComponentPropsWithoutRef<'button'> {
    icon:string
    // Functia onClick este optionala
    onClick?:()=>void
    style?:React.CSSProperties
}

// Un buton de tip toggle, ce afiseaza doua imagini, in functie de stare.
// Starea de activare este considerata externa, prin intermediul proprietatii "isOn". Trebuie oferita functia de setare
// a starii.
export function ButtonWithIcon({onClick, icon, style, ...rest}:ButtonWithIconProps) {

    let defaultStyle:React.CSSProperties =
        {height:"2rem",
        aspectRatio:"1/1",
        padding:"0",
        alignItems:"center",
        justifyItems:"center"}

    Object.assign(defaultStyle, style)

    return (
        <button style={defaultStyle} onClick={()=>{
            if (onClick) onClick()
        }} {...rest}>

            <img style={{
                width:"75%",
                aspectRatio:"1/1",
                display:"block",
            }}
                 src={icon} alt=''></img>
        </button>
    )
}