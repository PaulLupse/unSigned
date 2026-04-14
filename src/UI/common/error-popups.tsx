import React from "react";
import {Tooltip} from "react-tooltip";
import * as lodash from 'lodash'

interface ErrorPopupProps {
    name:string
    errors:any
    place:"top"|"bottom"|"left"|"right"
}

export default function FormInputErrorPopup(props:ErrorPopupProps) {

    return (
        <Tooltip content={lodash.get(props.errors, props.name)?.message} id={props.name} border={'1px solid black'} variant={"error"} place={props.place} isOpen={!!lodash.get(props.errors, props.name)}
            style={{
                borderRadius:'0',
                color:"black",
                zIndex:'10'
            }}
        />
    )
}