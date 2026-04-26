import React from "react";
import {
    type UseFormRegister,
    type FieldErrors,
} from "react-hook-form";

import type {TextQuestion, GridQuestion, NewForm} from "../../../domain/types";
import {QuestionDisplayer} from "../QuestionDisplayer/QuestionDisplayer";
import FormInputErrorPopup from "../../../common/error-popups";
import {useAlert} from "../../AlertProvider";

import "./FormEditor.css"
import "../CommonFormStyle.css"

interface QuestionListProps {
    formQuestions:Array<GridQuestion|TextQuestion>
    deleteQuestionHandler:(questionIndex:number)=>void
    editQuestionHandler:(questionIndex:number)=>void
}

function QuestionList({formQuestions, deleteQuestionHandler, editQuestionHandler}:QuestionListProps) {

    const {showAlert} = useAlert()

    return (
        <ol className={"question-list"}>
            {
                formQuestions.map(
                    (question:TextQuestion|GridQuestion, index:number)=> {
                        return(
                            <div className={'question-group'}>
                                <QuestionDisplayer questionIndex={index+1} question={question} />

                                <button
                                    onClick={()=>{
                                        deleteQuestionHandler(index)}}
                                >
                                    -
                                </button>
                                <button onClick={()=>{ editQuestionHandler(index); }}>
                                    Edit
                                </button>
                            </div>
                        )
                    }
                )
            }
        </ol>
    )
}

interface EditableFormProps {
    register:UseFormRegister<NewForm>
    errors:FieldErrors<NewForm>
    formQuestions:Array<GridQuestion|TextQuestion>
    deleteQuestionHandler:(questionIndex:number)=>void
    editQuestionHandler:(questionIndex:number)=>void
}

// componenta utilizata doar pentru a afisa intrebarile chestionarului, care pot fii alterate
export function FormEditor({register, errors, formQuestions, deleteQuestionHandler, editQuestionHandler}:EditableFormProps) {

    return (
        <div className={'form'}>
            <div className={'title-frame'}>
                <input className={'form-title'}
                    defaultValue={"New Form"}
                        type='text'
                       data-tooltip-id={'formName'}
                       {...register('formName', {required:'Form name required!'})} placeholder="Form name"
                       readOnly={false}
                />
                <FormInputErrorPopup name={'formName'} errors={errors} place={"bottom"}/>
            </div>
            <QuestionList formQuestions={formQuestions} deleteQuestionHandler={deleteQuestionHandler} editQuestionHandler={editQuestionHandler} />
        </div>
    )
}