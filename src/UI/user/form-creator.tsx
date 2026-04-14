import React, {type SetStateAction, use, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {RefObject, Dispatch} from "react";
import {
    useForm,
    type SubmitHandler,
    type SubmitErrorHandler,
    type UseFormRegister,
    type UseFormWatch,
    type FieldErrors,
    useFieldArray,
    type Control,
    useWatch,
    type RegisterOptions, type UseFormHandleSubmit, type FieldArrayWithId,
} from "react-hook-form";
import { Tooltip } from 'react-tooltip'

import {logout, auto_login, add_form} from "./back-end-connection";
import configFile from "../config.json"
import type {FormInfo, MinimalFormInfo, NewForm, Submission} from "../domain/types";
import type {TextQuestion, GridQuestion} from "../domain/types";
import {DisplayQuestion} from "../common/DisplayQuestion";
import {type NavigateFunction, type Navigation, useNavigate} from "react-router-dom";
import FormInputErrorPopup from "../common/error-popups";

const baseURL:string = configFile.baseURL

import {ErrorMessage} from "@hookform/error-message";
import {gridQuestionSchema, minimalFormInfoSchema, newFormSchema, textQuestionSchema} from "../domain/schemas";
import {DialogWithButton} from "../components/Dialog/Dialog";
import {useAlert} from "../components/AlertProvider";


interface QuestionOptionsComponentProps {
    register:UseFormRegister<QuestionOptions>
    watch:UseFormWatch<QuestionOptions>
    control:Control<QuestionOptions>
    errors:FieldErrors<QuestionOptions>
}

interface NewQuestionPanelProps {
    setDisplayQuestionCreator:Dispatch<SetStateAction<any>>;
    addQuestionCallback:(question:GridQuestion|TextQuestion)=>void;
}

// Interfata folosita pentru a putea include variantele de raspuns in formularul de creare a unei intrebari noi.
// Necesar intrucat campurile de tip array (utilizate cu useFieldArray) accepta doar tipuri non-primitive.
interface GridChoice {
    text:string
}

// Interfata pentru definirea optiunilor unei intrebari.
interface QuestionOptions {
    text:string
    isOptional:boolean
    isMultipleChoice:boolean
    maxChars:number
    choices:GridChoice[]
}


interface newForm {
    formName:string
    formQuestions:Array<TextQuestion|GridQuestion>
}

interface GridQuestionChoiceComponentProps {
    option:FieldArrayWithId<QuestionOptions, 'choices', 'id'>
    register:UseFormRegister<QuestionOptions>
    index:number
    errors:FieldErrors<QuestionOptions>
    removeChoice:(optionIndex:number)=>void
}

// Componenta menita pentru afisarea optiunilor intrebarilor de tip text.
function TextQuestionOptions(props:QuestionOptionsComponentProps) {
    return (
        <div style={{display:'grid', gridTemplateColumns:'1fr', justifyItems:'center', alignItems:'center'}}>

            <div style={{
                display:'flex',
                justifyContent:'center'
            }}>
                <input {...props.register("isOptional")} type='checkbox'/>
                <label>Optional</label>
            </div>

            <div style={{
                display:'flex',
                gap:'5px'
            }}>
                <label>
                    Maximum answer characters:
                </label>
                <input data-tooltip-id={'maxChars'} style={{width: '4rem'}} {...props.register("maxChars", {max:{value:10000, message:"Answers should not have more than 10000 characters"}})} defaultValue={30}  type={'number'} />
                <FormInputErrorPopup name={"maxChars"} errors={props.errors} place={'top'} />
            </div>


        </div>

    )
}

// Componenta creata pentru a afisa caseta de introducere a unei variante de raspuns al intrebarii grila
function GridQuestionChoiceComponent ({option, register, removeChoice, index, errors}:GridQuestionChoiceComponentProps) {
    return (
        <li key={option.id} style={{
            marginBottom:'5px',
        }}>
            <div style={{
                display:'grid',
                gridTemplateColumns:'1fr auto',
                gap:'5px'
            }}>
                <input defaultValue={`Choice #${index}`} {...register(`choices.${index}.text`,
                        {required:'Option cannot be null.'})}
                       data-tooltip-id={`choices.${index}.text`}
                        type={'text'}/>

                <FormInputErrorPopup name={`choices.${index+1}.text`} errors={errors} place={'left'} />

                <button style={{aspectRatio:'1/1', fontWeight:'bold'}} type="button" onClick={()=>{removeChoice(index)}}>
                    -
                </button>
            </div>
        </li>
    )
}

// Componenta menita pentru afisarea optiunilor intrebarilor de tip grilă.
function GridQuestionOptions(props:QuestionOptionsComponentProps) {

    // folosim un camp de tip array pentru a inregistra optiunile intrebarii grila
    const {fields, append, remove} = useFieldArray<QuestionOptions>({control:props.control, name:"choices"})

    function addChoice() {
        append({text:''});
    }

    function removeChoice(optionIndex:number) {
        remove(optionIndex);
    }

    return (
        <div style={{
            display:'flex',
            gap:'10px',
            flexDirection:'column'
        }}>
            <div style={{
                display:'grid',
                gridTemplateColumns:'1fr 1fr',
                justifyItems:'center',
                alignItems:'center'
            }}>
                <div style={{
                    display:'flex'
                }}>
                    <input {...props.register("isOptional")} type='checkbox'/>
                    <p style={{margin:'0'}}>Optional</p>
                </div>

                <div style={{
                    display:'flex'
                }}>
                    <input {...props.register("isMultipleChoice")} type='checkbox'/>
                    <p style={{margin:'0'}}>Multiple choice</p>
                </div>
            </div>


            {
                fields.length>0 &&
                <ol style={{
                    margin:'0', paddingRight:'40px'
                }}>
                    {
                        fields.map((option, index)=>{
                            return (
                                <GridQuestionChoiceComponent option={option}
                                                             register={props.register}
                                                             index={index}
                                                             errors={props.errors}
                                                             removeChoice={removeChoice} />
                            )
                        })
                    }
                </ol>
            }

            <div style={{display:'grid', alignItems:"center", justifyItems:'center'}}>
                <button type="button" onClick={addChoice} style={{
                    width:'8rem'
                }}>
                    Add option +
                </button>
            </div>


        </div>

    )
}

// Componenta ce afiseaza TOATE optiunile pentru adaugarea unei noi inmtrebari.
function NewQuestionPanel(props:NewQuestionPanelProps) {

    const [questionType, setQuestionType] = React.useState('text');

    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<QuestionOptions>();


    // handler pentru adaugarea unei noi intrebari
    const submit:SubmitHandler<QuestionOptions> = async (data:QuestionOptions)=>{

        if(questionType==='grid') {
            const gridQuestion:GridQuestion =
                gridQuestionSchema.parse({text:data.text,
                type:'grid',
                choices:data.choices.map(choice => choice.text),
                isOptional:data.isOptional,
                isMultipleChoice:data.isMultipleChoice})

            props.addQuestionCallback(gridQuestion);
        }
        else if(questionType==='text') {

            const textQuestion:TextQuestion = textQuestionSchema.parse(
                {
                    text:data.text,
                    type:'text',
                    isOptional:data.isOptional,
                    maxChars:data.maxChars
                })

            props.addQuestionCallback(textQuestion);
        }

        // panoul de creat intrebare noua dispare atunci cand este adaugata o noua intrebare
        props.setDisplayQuestionCreator(false);
    };

    return (
        <div id="CreateNewQuestionDiv"
             style={
            {
                flexGrow:'1',
                maxWidth:'400px',
                padding:'10px',
                border:'1px solid',
                position:"sticky",
                top:'130px',
                margin:'30px'
            }}>

            <form onSubmit={handleSubmit(submit)}>

                <div style={{
                    display:"flex",
                    flexDirection:'column',
                    gap:'10px',
                }}>

                    <div style={{
                        display:"flex",
                        flexDirection:'column',
                        alignItems:'center',
                        gap:'10px'
                    }}>
                        <textarea id="question" data-tooltip-id={'text'} {...register("text", {required:"Question text cannot be null."})} placeholder="Question text"
                               style={{border:'1px solid',
                                        maxWidth:'400px',
                                        height:'4rem',
                                        alignSelf:'stretch',
                                        padding:'5px',
                                        overflow:'scroll',
                                        resize:'none'}} />

                        <FormInputErrorPopup name={'text'} errors={errors} place={"bottom"}/>

                        {/* selector al tipului de intrebare */}
                        <select onChange ={
                            (event) => {
                                setQuestionType(event.target.value);
                            }
                        }>
                            <option value='text'>Text Question</option>
                            <option value='grid'>Grid Question</option>
                        </select>
                    </div>


                    {
                        questionType==='grid' &&
                        <GridQuestionOptions register={register} watch={watch} errors={errors} control={control} />
                    }
                    {
                        questionType==='text' &&
                        <TextQuestionOptions register={register} watch={watch} errors={errors} control={control} />
                    }

                    <div style={{display:'flex', justifyContent:'space-evenly'}}>
                        <button type={"button"} onClick={()=>{props.setDisplayQuestionCreator(false);}} className="button" style={{width:'8rem'}}>Cancel</button>
                        <input type="submit" value="Confirm" className="plain-button" style={{width:'8rem'}}/>
                    </div>

                </div>
            </form>
        </div>
    )
}

interface PreviewPanelProps {
    register:UseFormRegister<newForm>
    handleSubmit:UseFormHandleSubmit<newForm>
    errors:FieldErrors<newForm>
    createNewForm:SubmitHandler<newForm>
    navigate:NavigateFunction
    setDisplayQuestionCreator:Dispatch<SetStateAction<boolean>>
    formQuestions:Array<GridQuestion|TextQuestion>
    deleteQuestion:(questionIndex:number)=>void
}

function PreviewPanel({handleSubmit, createNewForm, navigate, setDisplayQuestionCreator, register, errors, formQuestions, deleteQuestion}:PreviewPanelProps) {
    return (
        <div className={'form-frame'}>

            <form onSubmit={handleSubmit(createNewForm)} style={{display:'flex', flexDirection:'column', gap:'10px'}}>

                <div id={"buttons-frame"} style={{
                    display:'grid',
                    gridTemplateColumns:"repeat(3, 1fr)",
                    gap:'10px'
                }}>
                    {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                    <button type='button' onClick={()=>{navigate(-1);}} style={{
                         flexGrow:'1'
                    }}>
                        Back
                    </button>

                    <button type='button' onClick={
                            async() => {
                                setDisplayQuestionCreator(true)
                            }
                    }   style={{
                        flexGrow:'1'
                    }}
                    >Add new question</button>

                    {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                    <input type='submit' value='Create form' style={{
                         flexGrow:'1'
                    }} className='plain-button'
                    />

                </div>


                {/* aici se afiseaza preview-ul*/}
                <ol className={'form-question-list'}>

                    <div style={{
                        display:'flex',
                        justifyContent:'center'
                    }}>

                        <input defaultValue={"New Form"}
                                type='text'
                               data-tooltip-id={'formName'}
                               {...register('formName', {required:'Form name required!'})} placeholder="Form name" style={{
                            border:'0px',
                            borderBottom:'dashed 1px',
                            maxWidth:'200px',
                            textAlign:'center',
                            flexGrow:'1'
                        }} readOnly={false}/>
                        <FormInputErrorPopup name={'formName'} errors={errors} place={"bottom"}/>

                    </div>

                {
                    formQuestions.map(
                        (question:TextQuestion|GridQuestion, index:number)=> {
                            return(
                                <div key={index} style={{
                                    display: 'grid',
                                    gridTemplateColumns:'1fr auto'
                                }}>
                                    <DisplayQuestion questionIndex={index+1} question={question} />

                                    <DialogWithButton buttonStyle={{
                                        margin:'5px',
                                        aspectRatio:'1/1',
                                        alignSelf:"center",
                                        justifySelf:'center',
                                        height:'3rem'
                                    }}
                                        buttonText={'-'}
                                        buttonOnClick={()=>deleteQuestion(index)}
                                        text={"Are you sure you want to delete this question?"} />

                                </div>
                            )
                        }
                    )
                }
                </ol>
            </form>
        </div>
    )
}


// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function FormCreator() {

    const [displayQuestionCreator, setDisplayQuestionCreator] = React.useState(false);
    const {showAlert} = useAlert()

    const navigate = useNavigate();


    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<newForm>({defaultValues:{formQuestions:[]}});
    const {append, remove} = useFieldArray({control, name:'formQuestions'});
    const formQuestions = watch("formQuestions");

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex);
    }

    const createNewForm:SubmitHandler<newForm> = async(data:newForm) => {


        const newForm:NewForm = newFormSchema.parse({
                                name:data.formName,
                                questions:data.formQuestions,
                            })

            const newFormId:string = await add_form(newForm);
            if(newFormId) {
                showAlert("Form created successfully",
                    [
                        {
                            text:"OK",
                            action:()=>navigate(`/view-form/${newFormId}`)
                        }
                    ]);
            }
            else alert("Could not create form.")
    }

    return (
        <div id="Continut" style={{
            display:'flex',
            alignItems:'start',
            height:'100%',
            justifyContent:'center'
        }}>

            <PreviewPanel handleSubmit={handleSubmit}
                          createNewForm={createNewForm}
                          navigate={navigate}
                          setDisplayQuestionCreator={setDisplayQuestionCreator}
                          register={register}
                          errors={errors}
                          formQuestions={formQuestions}
                          deleteQuestion={deleteQuestion} />

            {
                displayQuestionCreator &&
                <NewQuestionPanel setDisplayQuestionCreator={setDisplayQuestionCreator}
                    addQuestionCallback={
                        (question:TextQuestion|GridQuestion) => {
                            append(question);
                        }
                }/>
            }

        </div>

    )
}
