import {createRoot} from "react-dom/client";
import {Route, Routes, BrowserRouter, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {ErrorMessage} from "@hookform/error-message";
import type {SubmitHandler} from "react-hook-form";
import React from "react";
import {z} from 'zod'
import {formInfoSchema, gridAnswerSchema, submissionSchema, textAnswerSchema} from '../domain/schemas'
import { zodResolver } from '@hookform/resolvers/zod';

import {use_key, submit_form} from "./back-end-connection";
import {FormInfo, GridQuestion, type Submission, TextQuestion} from "../domain/types";

interface KeyFormInput {
    key:string
}
interface ShowFormComponentState {
    form:FormInfo
}

type SubmissionType = z.infer<typeof submissionSchema>
type FormInfoType = z.infer<typeof formInfoSchema>




function ShowFormComponent() {

    const locationState = useLocation().state;
    let form = locationState.form;
    const key = locationState.key;

    form = new FormInfo(form);

    const {register, formState:{errors}, handleSubmit} = useForm();

    const onSubmit:SubmitHandler<any> = async (data)=>{
        try {
            const answers:any[] = Object.values(data)
            const submision:SubmissionType = submissionSchema.parse({answers:[]})

            for(const [key, value] of answers.entries()) {

                submision.answers.push(
                    form.questions[key] instanceof TextQuestion ?
                        textAnswerSchema.parse({text: value})
                        :
                        form.questions[key] instanceof GridQuestion && form.questions[key].isMultipleChoice?
                            gridAnswerSchema.parse({choices: value})
                            :
                            gridAnswerSchema.parse({choices: [value]})
                );
            }

            console.log(submision);
            const submitResponse = await submit_form(key, submision);
            if(submitResponse)
                alert("Form submitted succesfully.")
            else alert("Could not submit form.")
        }
        catch(error) {
            alert(error)
        }
    }

    return (
    <div className={'form-frame'}>

        <form onSubmit={handleSubmit(onSubmit)}>

            <ol className={'form-question-list'}>
                <h2 className={'form-title'}>
                    {form.name}
                </h2>
                {
                    form.questions.map((question:TextQuestion|GridQuestion, index:number)=>{

                        return (
                            <>
                            <li className={'form-question'}>
                                <div id={"Intrebarea #" + index} key={index} style={{display:'flex', flexDirection:'column'}}>
                                    {question.text}
                                    {
                                       (question instanceof TextQuestion)?
                                           <div style={{display:'flex', justifyContent:'stretch'}} key={index}>
                                                <input {...register(`${index}`, {required:{value:!question.isOptional, message:"Required!"}})} type='text' style={{flexGrow:'1'}}/>
                                           </div>
                                           :
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
                                    }
                                </div>
                            </li>

                            <ErrorMessage name={`${index}`} errors={errors} render={({message})=>
                                <p style={{color:'red'}}>
                                    {message}
                                </p>
                            } />
                            </>
                        );
                    })
                }
            </ol>
            <div style={{display:"flex", justifyContent:'center', marginTop:'30px'}}>
                <input className={'plain-button'} type={"submit"} />
            </div>
        </form>
    </div>
    );
}

function KeyInputComponent() {

    const {register, handleSubmit, formState:{errors, isValidating}} = useForm<KeyFormInput>();
    const navigate = useNavigate();

    // functia ia ca parametru o cheie si realizaeaza un apel la server
    // in caz fericit, returneaza datele unui chestionar
    const onSubmit:SubmitHandler<KeyFormInput> = async ({key}:KeyFormInput):Promise<void>=>{

        const form:FormInfo|undefined = await use_key(key);
        if(form) {
            navigate("/complete-form/form", {state:{form:form, key:key}});
        }
    }

    return(
        <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{display:"flex", flexDirection:'column', gap:'5px'}}>
                    <label style={{textAlign:'center'}}>Input form key here:</label>
                    <input {...register("key", {required:"Field required", maxLength:{value:30, message:'Mai usor foamea!'}})} placeholder={"Form key"}/>
                    <input type={"submit"} value={'Open'}/>

                    {isValidating&&"Aveti putintica rabdare . . ."}
                    <ErrorMessage name={"key"} errors={errors} render={(data)=>
                        {
                            return(
                                <div style={{margin:'0 auto', color:'red'}}>
                                    {data.message}
                                </div>
                            );
                        }
                    } />

                </div>
            </form>
        </div>
    )
}

function Base() {

    return (
        <>
            <header style={{position:'fixed', width:'100%'}}>
                <div style={{display:'flex', justifyContent:'center'}}>
                    <h1>inFORMatica</h1>
                </div>
            </header>
            <div id={"Toata pagina"} style={{height:'100vh', display:"flex", justifyContent:'center', alignItems:'center'}}>
                <Outlet />
            </div>
        </>

    );
}

window.onload = ()=>{
    const rootDivElement:HTMLDivElement = document.getElementById('root')  as HTMLDivElement
    const rootComponent = createRoot(rootDivElement);
    rootComponent.render(
        <BrowserRouter>
            <Routes>
                <Route path={'complete-form'} element={<Base />}>
                    <Route index element={<KeyInputComponent />}></Route>
                    <Route path={"form"} element={<ShowFormComponent />}></Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}