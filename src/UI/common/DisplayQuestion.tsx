// acest script contine componente folosite pentru afisarea intrebarilor

import type {GridQuestion, TextQuestion} from "../domain/types";
import React from "react";

export function TextQuestionComponent({question, index}:{question:TextQuestion, index:number}) {
    return (
        <div style={{display:'flex', justifyContent:'stretch'}} key={index}>
            <input type='text' style={{flexGrow:'1'}}/>
        </div>
    )
}

export function GridQuestionComponent({question, index}:{question:GridQuestion, index:number}) {
    return (
        <div className={'form-grid-question-choices-frame'} key={index}>
        {
            question.choices.map((choice:string, choiceIndex:number)=>{
                return (
                    question.isMultipleChoice?
                    <div key={choiceIndex}>
                        <input type={'checkbox'} value={choiceIndex}/>
                        {choice}
                    </div>
                    :
                    <div key={choiceIndex}>
                        <input type={'radio'} value={choiceIndex}/>
                        {choice}
                    </div>

                )
            })
        }
        </div>
    )
}

export interface DisplayQuestionProps {
    question:TextQuestion|GridQuestion
    questionIndex:number
}

export function DisplayQuestion(props:DisplayQuestionProps) {

    const index:number = props.questionIndex;
    const question = props.question;
    return(
        <li key={props.questionIndex} className={'form-question'}>
            <div id={"Intrebarea #" + index} key={index} style={{display:'flex', flexDirection:'column'}}>
                <p style={{margin:'0', paddingLeft:'5px'}}>
                    {question.text}
                </p>

                {
                   question.type=='text'?
                       <TextQuestionComponent question={question} index={index}/>
                       :
                       <GridQuestionComponent question={question} index={index}/>
                }
            </div>
        </li>
    )
}