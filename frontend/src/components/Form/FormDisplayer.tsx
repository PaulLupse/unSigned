import React from "react";
import {QuestionDisplayer} from "./QuestionDisplayer/QuestionDisplayer";

import "./CommonFormStyle.css"
import type {FieldErrors, UseFormRegister, UseFormResetField} from "react-hook-form";
import {log} from "src/utilities";
import {ElemType, type Form, type FormElementUnion, type Template} from "src/domain/types";


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
    form:Form|Template
    register?:UseFormRegister<any>
    errors?:FieldErrors<any>
    resetField?:UseFormResetField<any>
}

export function FormDisplayer({form:{title, elements}, register, errors, resetField}:FormDisplayerProps) {

    return (
        <div className={'form'}>

            <div className={'title-frame'}>
                <h2 className={'form-title'}>
                    {title}
                </h2>
            </div>

            <ElementList elements={elements}
                          register={register}
                          errors={errors}
                          resetField={resetField} />

        </div>
    )
}
