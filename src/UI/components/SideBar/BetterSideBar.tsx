import React from 'react'
import {Drawer} from "@mui/material";
import './BetterSideBar.css'

interface SideBarProps {
    isOpen:boolean
    setIsOpen:(isOpen:boolean)=>void
    anchor:'left'|'right'|'top'|'bottom'
}

export default function SideBar(props:SideBarProps) {
    return(
        <Drawer classes={{
            paper: 'sidebar',
            root: 'sidebarRoot'
        }}
            slotProps={{backdrop: {className:'sidebarBackdrop'}}}
            anchor={props.anchor}
            open={props.isOpen}
            onClose={()=>props.setIsOpen(false)} >
            <h2>
                Quick access
            </h2>
            <p>
                My accout
            </p>
            <hr />
            <p>
                Forms
            </p>
            <hr />
            <p>
                Submission data
            </p>
            <hr />
            <p>
                Templates
            </p>
        </Drawer>
    )
}

