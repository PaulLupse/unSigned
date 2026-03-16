// acest script contine componente folosite pentru afisarea intrebarilor

import {GridQuestion, TextQuestion} from "../domain/types";
import React from "react";

export interface TextQuestionProps {
    text:string
    isOptional:boolean
    maxCharacters:number
}

export function TextQuestionComponent(props:TextQuestionProps) {
    return (
        <input type='text' maxLength={props.maxCharacters}/>
    )
}

export interface GridQuestionProps {
    text:string
    isOptional:boolean
    isMultipleChoice:boolean
    choices:Array<string>
}

export function GridQuestionComponent(props:GridQuestionProps) {
    return (
        <>
        {
            props.choices.map(
                (choice:string, index:number)=> {
                    return (
                        <div key={index} style={{display:'flex', alignItems:'center'}}>
                            <input type={props.isMultipleChoice?'checkbox':'radio'} />
                            <p style={{margin:'0'}}> {index+1}. {choice}</p>
                        </div>
                    )
                }
            )
        }
        </>
    )
}

export interface DisplayQuestionProps {
    question:TextQuestion|GridQuestion
    questionIndex:number
}

export function DisplayQuestion(props:DisplayQuestionProps) {

    const index:number = props.questionIndex
    const question = props.question
    return(
        <div key={index}>
            <p style={{margin:'5px'}}>
                {index}. {question.text}
            </p>
            {
               (question instanceof TextQuestion)?
                   <TextQuestionComponent text={question.text}
                                          isOptional={question.isOptional}
                                          maxCharacters={question.maxChars} />
                   :
                   <GridQuestionComponent text={question.text}
                                          isOptional={question.isOptional}
                                          isMultipleChoice={question.isMultipleChoice}
                                          choices={question.choices} />
            }
        </div>
    )
}