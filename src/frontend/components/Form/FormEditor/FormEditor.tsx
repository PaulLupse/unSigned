import React from "react";
import {
    type UseFormRegister,
    type FieldErrors,
} from "react-hook-form";

import type {TextQuestion, GridQuestion, NewForm} from "src/frontend/domain/types";
import {QuestionDisplayer} from "../QuestionDisplayer/QuestionDisplayer";
import FormInputErrorPopup from "src/frontend/components/FormInputErrorPopup/FormInputErrorPopup";

import "../CommonFormStyle.css"
import {QuestionEditor} from "../QuestionEditor/QuestionEditor";
import * as style from './FormEditor.module.css'


interface EditableFormProps {
    register:UseFormRegister<NewForm>
    errors:FieldErrors<NewForm>
    formQuestions:Array<GridQuestion|TextQuestion>
    addNewQuestion:()=>number
    swapQuestions:(q1Index:number, q2Index:number)=>void
    saveQuestion:(questionIndex:number, questionOptions:TextQuestion|GridQuestion) => void
    deleteQuestion:(questionIndex:number)=>void
}

// componenta utilizata doar pentru a afisa intrebarile chestionarului, care pot fii alterate
export function FormEditor({register, errors, formQuestions, addNewQuestion, swapQuestions, saveQuestion, deleteQuestion}:EditableFormProps) {

    const [editingQuestions, setEditingQuestions] = React.useState<Set<number>>(new Set<number>());
    const [newQuestions, setNewQuestions] = React.useState<Set<number>>(new Set<number>());

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

    const markQuestionNew = (questionIndex:number) => {
        const newSet = new Set<number>(newQuestions);
        newSet.add(questionIndex);
        setNewQuestions(newSet);
    }

    const unmarkQuestionNew = (questionIndex:number) => {
        const newSet = new Set<number>(newQuestions);
        newSet.delete(questionIndex);
        setNewQuestions(newSet);
    }

    const setQuestionNew = (questionIndex:number, set:boolean) => {
        if(set) markQuestionNew(questionIndex)
        else unmarkQuestionNew(questionIndex)
    }

    const questionIsNew = (questionIndex:number) => {
        return newQuestions.has(questionIndex)
    }

    return (
        <div className={'form'}>

            <div className={'title-frame'}>
                <input className={style.formTitleInput}
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
                                                deleteQuestion={deleteQuestion}
                                                setQuestionNew={setQuestionNew}
                                                questionIsNew={questionIsNew}
                                                />
                                    :
                                <div className={style.questionGroup}>
                                    <QuestionDisplayer question={question} index={index} />

                                    <div className={style.questionButtonsFrame}>

                                        <button  type={"button"} onClick={()=>{deleteQuestion(index)}}>
                                            -
                                        </button>

                                        <button
                                            type={'button'}
                                            className={style.upButton}
                                            disabled={index == 0 || editingQuestions.has(index-1)}
                                            onClick={()=>swapQuestions(index, index-1)}/>

                                        <button type={"button"} className={style.editButton}
                                                onClick={()=>{
                                                    setQuestionToBeEdited(index, true)
                                                }} />

                                        <button
                                            type={'button'}
                                            className={style.downButton}
                                            disabled={index == formQuestions.length - 1  || editingQuestions.has(index+1)}
                                            onClick={()=>swapQuestions(index, index+1)}/>
                                    </div>


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
                            markQuestionToBeEdited(newQuestionId)
                            markQuestionNew(newQuestionId)
                        }}>
                    +
                </button>
            </div>
        </div>
    )
}