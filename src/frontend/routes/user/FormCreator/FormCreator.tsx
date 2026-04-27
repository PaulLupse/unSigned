import React from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {add_form} from "../back-end-connection";
import type {NewForm} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {useNavigate} from "react-router-dom";

import {newFormSchema} from "../../../domain/schemas";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor";

import 'src/frontend/components/Form/CommonFormStyle.css'
import 'src/frontend/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/frontend/components/Form/QuestionDisplayer/QuestionDisplayer.css'
import * as style from './FormCreator.module.css'
import {FixedElement} from "src/frontend/components/FixedElement/FixedElement"

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function FormCreator() {

    const navigate = useNavigate();

    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<NewForm>({defaultValues:{questions:[]}});
    const {append, update, remove} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

    const {mutate} = useMutation({
        mutationFn:add_form,
        onSuccess:()=>{
            toast.success("Form added successfully!");
            navigate("/")
        },
        onError:(error)=>{
            toast.error("Could not create form. " + error?.message);
        }
    })


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {text:"", type:"text", maxChars:30, isOptional:false}
        append(newQuestion);
        return formQuestions.length;
    }

    const saveQuestionChanges = (questionIndex:number, questionOptions:TextQuestion|GridQuestion) => {
        update(questionIndex, questionOptions);
    }

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex)
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {

        console.log(data);
        const newForm:NewForm = newFormSchema.parse({
                                name:data.name,
                                questions:data.questions,
                            })
        mutate(newForm);
    }

    return (
        <div className={style.main}>
            <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)} style={{width:'100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formQuestions={formQuestions}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}/>
            </form>

            <FixedElement>
                  <ButtonBar>
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <button type='button' onClick={()=>{navigate(-1);}}>
                            Back
                        </button>

                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                      <button form={"barosan"} type='submit' className='plain-button'>Create new form</button>
                  </ButtonBar>
            </FixedElement>
            
        </div>
    )
}
