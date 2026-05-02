import React from 'react'
import {Drawer} from "@mui/material";
import './BetterSideBar.css'
import {Link} from "react-router-dom";

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
            slotProps={{backdrop: {className:'sidebarBackdrop'}, root:{className:'sidebarRoot'}}}
            anchor={props.anchor}
            open={props.isOpen}
            onClose={()=>props.setIsOpen(false)}
            >

            <button className={'collapse-button'}
                onClick={()=>{props.setIsOpen(false)}}
            >
            </button>

            <h2>
                Quick access
            </h2>
            <Link to={'/'} onClick={()=>props.setIsOpen(false)}>
                <p>
                    Main page
                </p>
            </Link>
            <hr />
            <Link to={'/me'}  onClick={()=>props.setIsOpen(false)}>
                <p>
                    My account
                </p>
            </Link>
            <hr />
            <Link to={'/me/forms'} onClick={()=>props.setIsOpen(false)}>
                <p>
                    Forms
                </p>
            </Link>

            <hr />
            <Link to={'/me/templates'} onClick={()=>props.setIsOpen(false)}>
                <p >
                    Templates
                </p>
            </Link>

        </Drawer>
    )
}

