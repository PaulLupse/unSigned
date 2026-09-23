import React from "react";
import type {FormElementUnion, QuestionUnion} from "src/domain/types";
import {QuestionDisplayer} from "./QuestionDisplayer/QuestionDisplayer";

import "./CommonFormStyle.css"
import type {FieldErrors, UseFormRegister, UseFormResetField} from "react-hook-form";
import {ElemType} from "src/domain/schemas";
import {log} from "src/utilities";


interface QuestionListProps {
    elements:Array<FormElementUnion>
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

function ElementList({elements, register, errors, resetField}:QuestionListProps) {
    return (
        <ol className={'question-list'}>
            {
                elements.length > 0 ?
                    elements.map(
                        (element: FormElementUnion, index: number) => {

                            if (element.elemType === ElemType.QUESTION) {

                                return  <QuestionDisplayer key={index}
                                                           question={element}
                                                           index={index}
                                                           register={register}
                                                           errors={errors}
                                                           resetField={resetField}/>

                            }
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
    elements:Array<FormElementUnion>
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

export function FormDisplayer({name, elements, register, errors, resetField}:FormDisplayerProps) {

    return (
        <div className={'form'}>

            <div className={'title-frame'}>
                <h2 className={'form-title'}>
                    {name}
                </h2>
            </div>

            <ElementList elements={elements}
                          register={register}
                          errors={errors}
                          resetField={resetField} />

        </div>
    )
}
