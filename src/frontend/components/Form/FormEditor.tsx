import React from "react";
import {
    type UseFormRegister,
    type FieldErrors,
} from "react-hook-form";

import type {TextQuestion, GridQuestion, NewForm} from "src/frontend/domain/types";
import {QuestionDisplayer} from "./QuestionDisplayer/QuestionDisplayer";
import FormInputErrorPopup from "src/frontend/common/error-popups";

import "./CommonFormStyle.css"
import {QuestionEditor} from "./QuestionEditor/QuestionEditor";
import * as style from './FormEditor.module.css'


interface EditableFormProps {
    register:UseFormRegister<NewForm>
    errors:FieldErrors<NewForm>
    formQuestions:Array<GridQuestion|TextQuestion>
    addNewQuestion:()=>number
    saveQuestion:(questionIndex:number, questionOptions:TextQuestion|GridQuestion) => void
    deleteQuestion:(questionIndex:number)=>void
}

// componenta utilizata doar pentru a afisa intrebarile chestionarului, care pot fii alterate
export function FormEditor({register, errors, formQuestions, addNewQuestion, saveQuestion, deleteQuestion}:EditableFormProps) {

    const [editingQuestions, setEditingQuestions] = React.useState<Set<number>>(new Set<number>());

    const markQuestionToBeEdited = (questionIndex:number) => {
        const newSet = new Set<number>(editingQuestions);
        newSet.add(questionIndex);
        setEditingQuestions(newSet);
    }

    const unmarkQuestionToBeEdited = (questionIndex:number) => {
        const newSet = new Set<number>(editingQuestions);
        newSet.delete(questionIndex);
        setEditingQuestions(newSet);
    }

    const setQuestionToBeEdited = (questionIndex:number, set:boolean) => {
        console.log(set)
        if (set) markQuestionToBeEdited(questionIndex);
        else unmarkQuestionToBeEdited(questionIndex);
    }


    return (
        <div className={'form'}>

            <div className={'title-frame'}>
                <input className={style.formTitleInput}
                    defaultValue={"New Form"}
                       size={0}
                        type='text'
                       data-tooltip-id={'name'}
                       {...register('name', {required:'Form name required!'})} placeholder="Form name"
                       readOnly={false}
                />
                <FormInputErrorPopup name={'name'} errors={errors} place={"bottom"}/>
            </div>
            <ol className={'question-list'}>
            {
                formQuestions.map((question, index)=>{
                    return(
                        <>
                            {
                                editingQuestions.has(index)?
                                <QuestionEditor action={saveQuestion}
                                                questionIndex={index}
                                                setQuestionToBeEdited={setQuestionToBeEdited}
                                                questionData = {question}
                                                />
                                    :
                                <div className={'question-group'}>
                                    <QuestionDisplayer question={question} questionIndex={index} />
                                    <button  type={"button"} onClick={()=>{deleteQuestion(index)}}>
                                        -
                                    </button>
                                    <button type={"button"} className={'edit-button'}
                                            onClick={()=>{
                                                setQuestionToBeEdited(index, true)
                                            }}>
                                    </button>
                                </div>

                            }
                        </>
                    )
                })
            }
            </ol>

            <div style={{display:"grid", placeContent:'center'}}>
                <button type={'button'} style={{height:'2.5rem', aspectRatio:'1/1'}}
                        onClick={()=>{
                            const newQuestionId = addNewQuestion()
                            console.log(editingQuestions)
                            markQuestionToBeEdited(newQuestionId)
                        }}>
                    +
                </button>
            </div>
        </div>
    )
}