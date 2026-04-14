import type { FormInfo,  GridAnswer,  GridQuestion,  Submission, TextAnswer, TextQuestion} from "../domain/types";
import {get_form, delete_form} from "./back-end-connection";
import React from "react";

import type {MouseEvent} from "react";

import {DisplayQuestion} from "../common/DisplayQuestion";
import {Outlet, useNavigate, useOutletContext, useParams} from "react-router-dom";
import {formInfoSchema, gridAnswerSchema, textAnswerSchema} from "../domain/schemas";
import {useQuery, useQueryClient} from "@tanstack/react-query";


export function DisplayFrom() {

    const form: FormInfo = formInfoSchema.parse(useOutletContext());
    const navigate = useNavigate();

    async function deleteForm() {
        const deleteFormResponse: boolean = await delete_form(form.id);
        if (deleteFormResponse) {
            alert("Form deleted succesfully")
            navigate('/', {replace: true});
        } else alert("Could not delete form :(")
    }

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

                <div style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(4, 1fr)'
                }}>
                    <button onClick={() => {
                        navigate(-1);
                    }} style={{}}>
                        Back
                    </button>

                    <button onClick={()=>{
                        navigate('keys')
                    }}>
                        Distribute access
                    </button>

                    <button onClick={() => {
                        navigate('submissions')
                    }}>
                        See results
                    </button>

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

    let {data, isLoading, isError, error} = useQuery({queryKey:["form"], queryFn:async():Promise<FormInfo>=>get_form(formId), retry:1})

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