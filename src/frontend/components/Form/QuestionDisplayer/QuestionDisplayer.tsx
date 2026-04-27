// acest script contine componente folosite pentru afisarea intrebarilor

import type {GridQuestion, TextQuestion} from "../../../domain/types";
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
        <div className={'grid-choice-frame'} key={index}>
        {
            question.choices.map((choice:string, choiceIndex:number)=>{
                return (
                    <div className={'grid-choice'} key={choiceIndex}>
                        <input type={question.isMultipleChoice?'checkbox':'radio'} value={choiceIndex}/>
                        <p>{choice}</p>
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

export function QuestionDisplayer(props:DisplayQuestionProps) {

    const index:number = props.questionIndex;
    const question = props.question;
    return(
        <li key={props.questionIndex} className={'question'}>
            <div id={"Intrebarea #" + index} key={index} >

                <p className={'question-text'}>
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