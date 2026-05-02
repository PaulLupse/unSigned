import {
    Outlet, useLocation,
    useNavigate,
    useParams
} from "react-router-dom";
import {useOutletContext} from "react-router-dom";
import {useForm} from "react-hook-form";
import type {SubmitHandler} from "react-hook-form";
import React, {use, useEffect} from "react";
import {gridAnswerSchema, textAnswerSchema} from '../../domain/schemas'

import {use_key, submit_form, check_form_id, check_key} from "../../server/sub-users-server";
import type {FormInfo, GridQuestion, Submission, TextQuestion} from "../../domain/types";
import FormInputErrorPopup from "src/frontend/components/FormInputErrorPopup/FormInputErrorPopup";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast, {Toaster} from "react-hot-toast";
import SubUsersNavBar from "src/frontend/components/NavBar/SubUsersNavBar";
import * as style from './SubUsersMain.module.css'
import {FixedElement} from "src/frontend/components/FixedElement/FixedElement";
import {BackButton, NavButton} from "src/frontend/components/Buttons/Buttons";
import {FormDisplayer} from "src/frontend/components/Form/FormDisplayer";
import ButtonBar from "src/frontend/components/Buttons/ButtonBar/ButtonBar";

interface KeyFormInput {
    key:string
}

export function parseGridChoices (choices:string[]) {
    return choices.map(choice=>parseInt(choice))
}

function parseData(data:any, form:FormInfo):Submission {
    const answers:any[] = Object.values(data)
    const submission:Submission = {answers:[]}

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

    const nav = useNavigate()
    if (key==='') nav(`/complete-form/${formId}`)

    // query folosit pentru a accesa formularul
    const {data, error} = useQuery({
        queryFn:()=>use_key({k:key, formId:formId}),
        queryKey:['form'],
        retry:0,
        refetchOnWindowFocus:false
    })

    const submit = useMutation({
        mutationFn:submit_form,
        onSuccess:()=>{
            toast.success("Form submitted successfully!");
            nav(`/complete-form/${formId}/done`, {replace:true});
        },
        onError:(error)=>{
            toast.error("Could not submit error: " + error);
        }
    })

    const {register, formState:{errors}, handleSubmit, resetField, reset, getValues} = useForm();

    const onSubmit:SubmitHandler<any> = async (inputData:any)=>{
        if(!data)
            return;

        console.log(data)

        const submission = parseData(inputData, data)
        submit.mutate({key:key, formId:formId, submission:submission})
    }

    return (
    <>

        {(data === undefined)?
            <div className={'loading'}>
                <p>
                    Loading...
                </p>
            </div>
        :

        <form id={"barosan"} onSubmit={handleSubmit(onSubmit)} className={style.formFrame}>
            <FormDisplayer name={data.name} questions={data.questions} register={register} errors={errors} resetField={resetField}/>
        </form>
        }

        <FixedElement>
            <ButtonBar>
                <BackButton>Back</BackButton>
                <button type={'button'} className={'plain-button'} onClick={()=>{reset()}}>
                    Clear choices
                </button>
                <button form={"barosan"} className={'plain-button'} type={"submit"} onClick={()=>{console.log(errors); console.log(getValues())}}>Submit</button>
            </ButtonBar>
        </FixedElement>

    </>
    );
}

export function KeyInputComponent() {

    const {register, handleSubmit, formState:{errors}, watch} = useForm<KeyFormInput>();
    const navigate = useNavigate();
    const inputtedKey = watch("key");

    const context:any = useOutletContext<any>()

    const setKey = context.setKey;
    const formId = context.formId;

    const {mutate} = useMutation({
        mutationFn:check_key,
        onSuccess:()=>{
            setKey(inputtedKey);
            navigate('complete')
        },
        onError:(error)=>{
            const msg = error.message;
            toast.error(msg);
        }
    })

    // functia ia ca parametru o cheie si realizaeaza un apel la server
    // in caz fericit, returneaza datele unui chestionar
    const onSubmit:SubmitHandler<KeyFormInput> = async ({key}:KeyFormInput):Promise<void>=>{
        mutate({key, formId})
    }

    return(
        <form onSubmit={handleSubmit(onSubmit)} className={style.keyInput}>

            <label >Input access key here:</label>
            <input data-tooltip-id={'key'} {...register("key", {required:"Field required"})} placeholder={"Enter access key"}/>
            <input className={'plain-button'} type={"submit"} value={'Open'}/>

            <FormInputErrorPopup name={'key'} errors={errors} place={'left'} />
        </form>
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
        <form onSubmit={handleSubmit(redirect)} className={style.formIdInput}>

            <label>
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

        </form>
    )
}

export default function SubUsersMain() {

    const queryClient = useQueryClient()
    const loc = useLocation()

    useEffect(() => {
        queryClient.removeQueries({queryKey:['form']})
    }, [loc]);

    return (
        <div id={"Toata pagina"} className={style.main}>
            <Toaster position="top-center"
                toastOptions={{
                        style:{
                            borderRadius:'0',
                            border:'1px solid'
                        }
                    }
                }
            />

            <SubUsersNavBar />

            <Outlet />

        </div>

    );
}