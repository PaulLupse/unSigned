import {type FormInfo, GridQuestion, TextQuestion} from "../domain/types";
import {add_form} from "./back-end-connection";
import React from "react";

import {DisplayQuestion} from "./display-questions";

interface ViewFormProps {
    form:FormInfo
}

export default function ViewForm() {


    return (
        <>
            <div style={{display:'flex', flexDirection:'column', justifyContent:"start", alignContent:"center",
                    maxWidth:'600px', flexGrow:'1', gap:'5px', padding:'10px', overflow:'auto'}}>

                <div style={{display:'flex', justifyContent:'center'}}>
                    <h1>
                        {props.form.name}
                    </h1>
                </div>
                <div style={{display:'flex', justifyContent:'center'}}>
                    <h1>
                        {props.form.key}
                    </h1>
                </div>

                {
                    props.form.questions.map(
                        (question:TextQuestion|GridQuestion, index:number)=> {
                            return(
                                <DisplayQuestion questionIndex={index+1} question={question} />
                            )
                        }
                    )
                }

            </div>
        </>

    )
}