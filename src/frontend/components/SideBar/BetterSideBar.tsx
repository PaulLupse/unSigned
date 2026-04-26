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
            <Link to={'/me'}>
                <p>
                    My accout
                </p>
            </Link>
            <hr />
            <Link to={'/me'}>
                <p>
                    Forms
                </p>
            </Link>

            <hr />
            <Link to={'/me'}>
                <p>
                    Submission data
                </p>
            </Link>
            <hr />
            <p>
                Templates
            </p>
            <hr />
            <Link to={'/'}>
                <p>
                    Main page
                </p>
            </Link>
        </Drawer>
    )
}

