import React from "react";
import type {GridQuestion,TextQuestion} from "../../../domain/types";
import {QuestionDisplayer} from "../QuestionDisplayer/QuestionDisplayer";

import "../CommonFormStyle.css"


interface QuestionListProps {
    questions:Array<TextQuestion|GridQuestion>
}

function QuestionList({questions}:QuestionListProps) {
    return (
        <ol className={'form-question-list'}>
            {
                questions.length > 0 ?
                    questions.map(
                        (question: TextQuestion | GridQuestion, index: number) => {
                            return (
                                <QuestionDisplayer key={index} questionIndex={index + 1} question={question}/>
                            )
                        }
                    ) :
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <h3>
                            This form has no questions.
                        </h3>
                    </div>
            }
        </ol>
    )
}

interface FormDisplayerProps {
    formName:string
    questions:Array<GridQuestion|TextQuestion>
}

export function FormDisplayer({formName, questions}:FormDisplayerProps) {

    return (
        <div className={'form'}>
            <div className={'title-frame'}>
                <h2 className={'form-title'}>
                    {formName}
                </h2>
            </div>
            <QuestionList questions={questions} />
        </div>
    )
}
