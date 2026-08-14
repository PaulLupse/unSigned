import React from "react";
import "./FixedElement.css"

interface BottomElementProps extends React.ComponentPropsWithoutRef<'div'> {
    children:React.ReactNode
}

export function FixedElement({children, ...props}:BottomElementProps) {
    return (
        <div className={'fixed-element'} {...props} >
            {children}
        </div>
    )
}