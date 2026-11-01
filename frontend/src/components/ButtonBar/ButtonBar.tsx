import React from "react";
import './ButtonBar.css'

interface ButtonBarProps {
    children:React.ReactNode
    style?:any
}

export default function ButtonBar({children, style}:ButtonBarProps) {
    return (
        <div className={'button-bar'} style={style}>
            {children}
        </div>
    )
}