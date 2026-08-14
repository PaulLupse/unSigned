import React, {useEffect} from 'react'
import {Menu, MenuItem} from "@mui/material";
import * as style from './FloatinMenu.module.css'

interface Option {
    text:string
    action?:()=>void
}

interface ButtonWithMenuProps {
    location:'top'|'bottom'
    buttonText:string
    options:Option[]
}

export default function ButtonWithMenu({location, options, buttonText}:ButtonWithMenuProps) {

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <button onClick={handleClick}>
                {buttonText}
            </button>

            <Menu
                disableScrollLock={true}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                transformOrigin={{
                    vertical:location=='top'?'bottom':'top',
                    horizontal:'left'
                }}
                anchorOrigin={{
                    vertical:location,
                    horizontal:'left'
                }}
                slotProps={{
                    paper: {
                        className:style.floatingMenu
                    },
                    list: {
                        className:style.floatingMenuList
                    }
                }}
            >
                {
                    options.map((option:Option)=>{
                        return (
                            <MenuItem className={style.item} onClick={()=>{option.action && option.action(); handleClose();}}>{option.text}</MenuItem>
                        )
                    })
                }
            </Menu>
        </>
    )
}