import React from 'react'
import './SideBar.css'

interface SidebarElementProps extends React.ComponentPropsWithoutRef<'div'>{
    children:React.ReactNode
}

function SidebarElement({children, ...props}:SidebarElementProps) {

    return (
        <>
            <div className={"element"} {...props}>
                {children}
            </div>
            <hr/>
        </>

    )
}

export default function SideBar() {

    return (
        <div className={'sidebar'}>
            <SidebarElement>
                <p>
                    Account
                </p>
            </SidebarElement>
            <SidebarElement>
                <p>
                    Forms
                </p>
            </SidebarElement>
            <SidebarElement>
                <p>
                    Templates
                </p>
            </SidebarElement>
            <SidebarElement>
                <p>
                    Submission data
                </p>
            </SidebarElement>
        </div>
    )
}