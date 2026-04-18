import type { FormInfo,  GridAnswer,  GridQuestion,  Submission, TextAnswer, TextQuestion} from "../domain/types";
import {get_form, delete_form} from "./back-end-connection";
import React from "react";

import type {MouseEvent} from "react";

import {DisplayQuestion} from "../common/DisplayQuestion";
import {Outlet, useNavigate, useOutletContext, useParams} from "react-router-dom";
import {formInfoSchema, gridAnswerSchema, textAnswerSchema} from "../domain/schemas";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {BackButton, NavButton} from "../components/Buttons/Buttons";
import {useAlert} from "../components/AlertProvider";
import toast from "react-hot-toast";


export function DisplayFrom() {

    const form: FormInfo = formInfoSchema.parse(useOutletContext());
    const navigate = useNavigate();

    const {mutate} = useMutation({
        mutationFn:delete_form,
        onSuccess:()=>{
            toast.success("Form deleted successfully!")
            navigate('/')
        },
        onError:(error)=>{
            toast.error("Could not delete form . . .")
        }
    })

    async function deleteForm() {
        mutate(form.id)
    }

    const status = form.datePublished?form.dateClosed?"Closed":"Published":"Not published"

    return (

        form &&
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'start',
            height: '100%',
            overflowY:"scroll"
        }}>

            <div className={'form-frame'}>

                <div style={{display:"flex", justifyContent:'space-between', alignItems:'center'}}>

                    <h3 style={{margin:0}}>
                        {status}
                    </h3>
                    {
                        status !== "Closed" &&
                        <button>
                            {status=="Published"?"Close":"Publish"}
                        </button>
                    }
                </div>

                <div style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(4, 1fr)'
                }}>
                    <BackButton>
                        Back
                    </BackButton>

                    <NavButton to={'keys'}>
                        Distribute keys
                    </NavButton>

                    <NavButton to={'submissions'}>
                        See results
                    </NavButton>

                    <button onClick={deleteForm}>
                        Delete
                    </button>
                </div>


                <ol className={'form-question-list'}>

                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <h1 className={'form-title'}>
                            {form.name}
                        </h1>
                    </div>

                    {
                        form.questions.length > 0 ?
                            form.questions.map(
                                (question: TextQuestion | GridQuestion, index: number) => {
                                    return (
                                        <DisplayQuestion key={index} questionIndex={index + 1} question={question}/>
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
            </div>
        </div>
    )
}

export function ViewForm() {

    const formId = useParams().formId as string;
    const navigate = useNavigate();

    let {data, isLoading, isError, error} = useQuery({
        queryKey:["form"],
        queryFn:async():Promise<FormInfo|undefined>=>get_form(formId),
        retry:1,
        refetchOnWindowFocus:false
    })

    console.log("Here!")

    // daca nu punem conditia de loading, crapa codu la refresh in /submissions ca nu apuca sa dea fetch
    return (
        isLoading?
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <h2>
                    Loading...
                </h2>
            </div>:
            isError?
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                    <h2>
                        {error?.message}
                    </h2>
                </div>:
            <Outlet context={data}/>
    )
}