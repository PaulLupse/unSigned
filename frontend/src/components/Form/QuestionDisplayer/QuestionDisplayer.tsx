// acest script contine componente folosite pentru afisarea intrebarilor

import type {GridQuestion, TextQuestion} from "../../../domain/types";
import React, {useMemo} from "react";

import * as style from './QuestionDisplayer.module.css'
import type {FieldErrors, UseFormRegister, UseFormReset, UseFormResetField} from "react-hook-form";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";


interface QuestionProps {
    index:number
    question:TextQuestion|GridQuestion
    register?:UseFormRegister<any>
}

interface TextQuestionProps extends QuestionProps {
    question:TextQuestion
}

interface GridQuestionProps extends QuestionProps {
    question:GridQuestion
}

export function TextQuestionComponent({question, index, register}:TextQuestionProps) {

    const reg = useMemo(()=>
        register?register(`${index}`,
            {
                required:{value:!question.isOptional, message:"Required!"},
                maxLength:{value:question.maxChars, message:`Answer limited to ${question.maxChars} characters!`}
            }):{}, [register])

    return (
        <div style={{display:'flex', justifyContent:'stretch'}}
             key={index}  >
            <input type='text' style={{flexGrow:'1'}} {...reg} readOnly={register===undefined}/>
        </div>
    )
}

export function GridQuestionComponent({question, index, register}:GridQuestionProps) {

    const reg = useMemo(()=>
        register?register(`${index}`,
            {
                required:{value:!question.isOptional, message:"Required!"},
            }):{}, [register])

    return (
        <div className={style.gridChoiceFrame} key={index}>
        {
            question.choices.map((choice:string, choiceIndex:number)=>{
                return (
                    <div className={style.gridChoice} key={choiceIndex}>
                        <input type={question.isMultipleChoice?'checkbox':'radio'}
                               readOnly={register===undefined} value={choiceIndex} {...reg}/>
                        <p style={{padding:'5px 0 5px 0'}}>{choiceIndex}.</p>
                        <p>{choice}</p>
                    </div>
                )
            })
        }
        </div>
    )
}

export function QuestionComponent({question, index, register}:QuestionProps) {

    return (
        <div id={"Intrebarea #" + index} key={index} data-tooltip-id={`${index}`}>

            <p  style={{marginBottom:'5px'}}>
                {question.text}
            </p>

            {
               question.type=='text'?
                   <TextQuestionComponent question={question} index={index} register={register}/>
                   :
                   <GridQuestionComponent question={question} index={index} register={register}/>
            }

            {
                !question.isOptional &&
                <p style={{marginTop:'5px'}}>
                    Required
                </p>
            }
        </div>
    )
}

export interface DisplayQuestionProps {
    question:TextQuestion|GridQuestion
    index:number
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

// componenta ce afiseaza pe ecran o intrebare
// daca proprietatea 'register' este pasata, se foloseste pentru inregistrarea componentei in formularul de care apartine
// acel register, altfel intrebarile sunt read-only
export function QuestionDisplayer({question, index, register, errors, resetField}:DisplayQuestionProps) {

    return(
        <li key={index} className={style.question} style={{border:question.isOptional?'1px solid black':'3px double black'}}>
            <QuestionComponent index={index}
                               question={question}
                               register={register}/>
            {
                errors &&
                <FormInputErrorPopup name={`${index}`} errors={errors} place={'top'} />
            }
            {
                resetField &&
                <button type={'button'} style={{marginTop:'5px'}} onClick={()=>resetField(`${index}`)}>
                    Clear choice
                </button>
            }
        </li>
    )
}