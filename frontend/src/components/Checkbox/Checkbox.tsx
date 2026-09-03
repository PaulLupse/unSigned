import React from "react";

interface CheckboxParams {
    checked:boolean
    setChecked:(val:boolean)=>void
    text: string
    location: "left"|"right"
}
export function Checkbox({location, text, checked, setChecked}:CheckboxParams) {

    return (
        <div>
            {
                location == 'left' &&
                <label htmlFor={"checkbox"} >
                    {text}
                </label>
            }
            <input type={"checkbox"}
                   checked={checked}
                   name={'checkbox'}
                   onChange={(evt)=>{setChecked(evt.target.checked)}} />
            {
                location == 'right' &&
                <label htmlFor={"checkbox"} >
                    {text}
                </label>
            }
        </div>

    )
}