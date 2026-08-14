import React from "react";
import {Tooltip} from "react-tooltip";
import * as lodash from 'lodash'
import * as style from './FormInputErrorPopup.module.css'

interface ErrorPopupProps {
    id?:string
    name:string
    errors:any
    place:"top"|"bottom"|"left"|"right"
}

export default function FormInputErrorPopup(props:ErrorPopupProps) {

    return (
        <Tooltip content={lodash.get(props.errors, props.name)?.message}
                 id={props.id?props.id:props.name}
                 border={'1px solid black'} variant={"error"}
                 place={props.place}
                 isOpen={!!lodash.get(props.errors, props.name)} 
                 className={style.errorPopup}
        />
    )
}