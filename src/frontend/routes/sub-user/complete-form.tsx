import {createRoot} from "react-dom/client";
import {
    Route,
    Routes,
    BrowserRouter,
    Outlet,
    useLocation,
    useNavigate,
    type Register,
    useParams
} from "react-router-dom";
import {useOutletContext} from "react-router-dom";
import {useForm} from "react-hook-form";
import {ErrorMessage} from "@hookform/error-message";
import type {SubmitHandler} from "react-hook-form";
import React, {useContext, useEffect} from "react";
import {z} from 'zod'
import {formInfoSchema, gridAnswerSchema, submissionSchema, textAnswerSchema} from '../../domain/schemas'
import { zodResolver } from '@hookform/resolvers/zod';

import {use_key, submit_form, check_form_id, check_key} from "./back-end-connection";
import type {FormInfo, GridQuestion, Submission, TextQuestion} from "../../domain/types";
import FormInputErrorPopup from "../../common/error-popups";
import {useMutation, useQuery} from "@tanstack/react-query";
import toast from "react-hot-toast";

interface KeyFormInput {
    key:string
}
interface ShowFormComponentState {
    form:FormInfo
}

type SubmissionType = z.infer<typeof submissionSchema>
type FormInfoType = z.infer<typeof formInfoSchema>


export function TextQuestionDisplayComponent({index, question, register}:{index:number, question:TextQuestion, register:any}) {
    return (
        <div style={{display:'flex', justifyContent:'stretch'}} key={index}>
            <input {...register(`${index}`, {required:{value:!question.isOptional, message:"Required!"}})} type='text' style={{flexGrow:'1'}}/>
       </div>
    )
}

export function GridQuestionDisplayComponent({index, question, register}:{index:number, question:GridQuestion, register:any}) {
    return (
        <div className={'form-grid-question-choices-frame'} key={index}>
        {
            question.choices.map((choice:string, choiceIndex:number)=>{
                return (
                    question.isMultipleChoice?
                    <div key={choiceIndex}>
                        <input {...register(`${index}`, {required:{value:!question.isOptional, message:"Required!"}})} type={'checkbox'} value={choiceIndex}/>
                        {choice}
                    </div>
                    :
                    <div key={choiceIndex}>
                        <input {...register(`${index}`, {required:{value:!question.isOptional, message:"Required!"}})} type={'radio'} value={choiceIndex}/>
                        {choice}
                    </div>
                )
            })
        }
        </div>
    )

}

export function parseGridChoices (choices:string[]) {
    return choices.map(choice=>parseInt(choice))
}

function parseData(data:any, form:FormInfo):Submission {
    const answers:any[] = Object.values(data)
    const submission:SubmissionType = {answers:[]}

    for(const [key, value] of answers.entries()) {

        submission.answers.push(
            form.questions[key]?.type == 'text' ?
                textAnswerSchema.parse({text: value, type:'text'})
                :
                gridAnswerSchema.parse({choices: value?parseGridChoices([...value]):[], type:'grid'})
        );
    }
    return submission
}

export function ShowFormComponent() {

    const context:any = useOutletContext();
    const key:string = context.key;
    const formId = context.formId;

    const navigate = useNavigate();

    const [form, setForm] = React.useState<FormInfo>()


    const {mutate, data, error} = useMutation({
        mutationFn:use_key,
        onError:()=>{
            if(error)
                toast.error(error.message);
            navigate(`/complete-form/${formId}`)
        }
    })

    const submit = useMutation({
        mutationFn:submit_form,
        onSuccess:()=>{
            toast.success("Form submitted successfully!");
        },
        onError:(error)=>{
            toast.error("Could not submit error: " + error);
        }
    })

    useEffect(()=> {
        const getForm = async () => {
            mutate({formId:formId, k:key})
        }
        getForm();
    }, [])


    const {register, formState:{errors}, handleSubmit, reset} = useForm();

    const onSubmit:SubmitHandler<any> = async (data:any)=>{
        if(!form)
            return;

        const submission = parseData(data, form)
        submit.mutate({key:key, formId:formId, submission:submission})
    }

    return (
    <div className={'form-frame'}>

        {(form === undefined)?
            <div>
                <p>
                    Loading...
                </p>
            </div>
        :

        <form onSubmit={handleSubmit(onSubmit)}>

            <ol className={'form-question-list'}>
                <h2 className={'form-title'}>
                    {form.name}
                </h2>
                {
                    form.questions.map((question:TextQuestion|GridQuestion, index:number)=>{

                        return (
                            <div key={index} >
                            <li className={'form-question'}>
                                <div id={"Intrebarea #" + index} key={index} style={{display:'flex', flexDirection:'column'}}>
                                    {question.text}
                                    {
                                       question.type === 'text' &&
                                           <TextQuestionDisplayComponent index={index} question={question} register={register} />
                                    }
                                    {
                                        question.type === 'grid' &&
                                            <GridQuestionDisplayComponent index={index} question={question} register={register} />
                                    }
                                </div>
                            </li>

                            <ErrorMessage name={`${index}`} errors={errors} render={({message})=>
                                <p style={{color:'red'}}>
                                    {message}
                                </p>
                            } />
                            </div>
                        );
                    })
                }
            </ol>
            <div style={{display:"grid", gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'10px', flexGrow:'1'}}>
                <button type={'button'} className={'plain-button'} onClick={()=>{navigate(-1)}}>
                    Back
                </button>
                <button type={'button'} className={'plain-button'} onClick={()=>{reset()}}>
                    Clear choices
                </button>
                <input className={'plain-button'} type={"submit"} />

            </div>

        </form>
        }
    </div>
    );
}

export function KeyInputComponent() {

    const {register, handleSubmit, formState:{errors, isValidating}} = useForm<KeyFormInput>();
    const navigate = useNavigate();

    const context:any = useOutletContext<any>();
    const setKey = context.setKey;
    const formId = context.formId;

    const {mutate, error} = useMutation({
        mutationFn:check_key,
        onSuccess:()=>{
            navigate('complete')
        },
        onError:()=>{
            if(error)
                toast.error(error.message);
        }
    })

    // functia ia ca parametru o cheie si realizaeaza un apel la server
    // in caz fericit, returneaza datele unui chestionar
    const onSubmit:SubmitHandler<KeyFormInput> = async ({key}:KeyFormInput):Promise<void>=>{
        mutate({key, formId})
    }

    return(
        <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{display:"flex", flexDirection:'column', gap:'5px', padding:'10px', border:'1px solid'}}>
                    <label style={{textAlign:'center'}}>Input access key here:</label>
                    <input data-tooltip-id={'key'} {...register("key", {required:"Field required"})} placeholder={"Enter access key"}/>
                    <input className={'plain-button'} type={"submit"} value={'Open'}/>

                    <FormInputErrorPopup name={'key'} errors={errors} place={'left'} />

                </div>
            </form>
        </div>
    )
}

export function BaseComponent() {

    const [key, setKey] = React.useState('');
    const params = useParams();
    const formId = params.formId;

    return (
        <Outlet context={{key: key, setKey:setKey, formId:formId}} />
    )
}

export function FormIdInputComponent () {

    const {register, handleSubmit, formState:{errors}} = useForm();
    const navigate = useNavigate();

    const redirect:SubmitHandler<any> = async (date:any)=> {
        navigate(`/complete-form/${date.formId}`)
    }

    return (
        <form onSubmit={handleSubmit(redirect)}>
            <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'5px', border:'1px solid', padding:'10px'}}>
                <label style={{textAlign:'center'}}>
                    Input form ID
                </label>
                <input data-tooltip-id={'formId'} size={24} placeholder={"Form ID"} {...register('formId', {validate:async(value:string):Promise<boolean|string>=> {

                    if(value.length != 24 || (! /^[0-9a-fA-F]+$/.test(value)))
                        return "Invalid form id"
                    const foundForm = await check_form_id(value);
                    if(foundForm)
                        return true;
                    return "Could not find form."
                }
                })} />
                <FormInputErrorPopup name={'formId'} errors={errors} place={"left"} />
                <input className={'plain-button'} style={{justifySelf:'stretch'}} type='submit' value={'Go to form'} />
            </div>

        </form>
    )
}

export function SubUsersMain() {

    return (
        <>
            <header style={{position:'fixed', width:'100%'}}>
                <div style={{display:'flex', justifyContent:'center'}}>
                    <h1>Secondary Page</h1>
                </div>
            </header>
            <div id={"Toata pagina"} style={{height:'100vh', display:"flex", justifyContent:'center', alignItems:'center'}}>
                <Outlet />
            </div>
        </>

    );
}