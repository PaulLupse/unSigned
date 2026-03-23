import {createRoot} from "react-dom/client";
import {Route, Routes, BrowserRouter, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {ErrorMessage} from "@hookform/error-message";
import type {SubmitHandler} from "react-hook-form";
import React from "react";
import {z} from 'zod'
import {formInfoSchema} from '../domain/schemas'

import {use_key, submit_form} from "./back-end-connection";
import {FormInfo, GridQuestion, TextQuestion} from "../domain/types";
import {DisplayQuestion} from "../common/display-questions";

interface KeyFormInput {
    key:string
}
interface ShowFormComponentState {
    form:FormInfo
}

function ShowFormComponent() {
    const locationState = useLocation().state;
    const locForm = formInfoSchema.parse(locationState.form);
    const key = locationState.key;
    const {register, formState:{errors}, handleSubmit} = useForm();

    const form = new FormInfo(locForm.name, locForm.questions, locForm.dateCreated, locForm.dateUpdated, locForm.submissions)

    const onSubmit:SubmitHandler<any> = (data)=>{
        console.log(Object.values(data));

    }

    return (
    <div className={'form-frame'}>

        <h2 className={'form-title'}>
            {form.name}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>

            <ol className={'form-question-list'}>
            {
                form.questions.map((question:TextQuestion|GridQuestion, index:number)=>{

                    return (
                        <DisplayQuestion question={question} questionIndex={index} />
                    );
                })
            }


            </ol><
            div style={{display:"flex", justifyContent:'center', marginTop:'30px'}}>
                <input style={{background:'white', border:'solid 1px'}} type={"submit"} />
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