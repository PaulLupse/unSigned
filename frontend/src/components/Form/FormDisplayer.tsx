import React from "react";
import type {GridQuestion,TextQuestion} from "../../domain/types";
import {QuestionDisplayer} from "./QuestionDisplayer/QuestionDisplayer";

import "./CommonFormStyle.css"
import type {Field, FieldErrors, UseFormRegister, UseFormReset, UseFormResetField} from "react-hook-form";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";


interface QuestionListProps {
    questions:Array<TextQuestion|GridQuestion>
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

function QuestionList({questions, register, errors, resetField}:QuestionListProps) {
    return (
        <ol className={'question-list'}>
            {
                questions.length > 0 ?
                    questions.map(
                        (question: TextQuestion | GridQuestion, index: number) => {
                            return (
                                <>
                                    <QuestionDisplayer key={index} question={question} index={index} register={register} errors={errors} resetField={resetField}/>
                                </>
                            )
                        }
                    ) :
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <h3>
                            No questions.
                        </h3>
                    </div>
            }
        </ol>
    )
}

interface FormDisplayerProps {
    name:string
    questions:Array<GridQuestion|TextQuestion>
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

export function FormDisplayer({name, questions, register, errors, resetField}:FormDisplayerProps) {

    return (
        <div className={'form'}>

            <div className={'title-frame'}>
                <h2 className={'form-title'}>
                    {name}
                </h2>
            </div>

            <QuestionList questions={questions} register={register} errors={errors} resetField={resetField} />

        </div>
    )
}
